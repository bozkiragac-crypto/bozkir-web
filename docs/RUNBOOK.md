# RUNBOOK — İşletim Notları

## Ortamlar

| Ortam | Nerede | Not |
| --- | --- | --- |
| Yerel | Geliştirici makinesi | `docker compose up -d db storage` + `npm run dev` |
| Üretim | VPS1 | `docker compose up -d` (db + wal-init + storage + app + nginx) |
| Off-site | VPS2 | restic deposu (şifreli yedek kopyası), SSH/SFTP |

## Deploy

1. `main` branch'e push → GitHub Actions **CI** (lint, typecheck, unit, build, E2E).
2. CI yeşil olunca **Deploy (VPS)** otomatik çalışır (`workflow_run`). Manuel tetik: `workflow_dispatch`.
3. Deploy sırası: **migrasyon öncesi yedek** → sürümlü imaj (`bozkir-app:<sha>`) → `up -d` → migrate + seed → derin healthcheck.
4. Sağlık kontrolü başarısız olursa **önceki sürüme otomatik rollback** yapılır ve iş kırmızı biter.

Gerekli GitHub Actions secret'ları:
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH` (ör. `/opt/bozkir-web`), opsiyonel `VPS_PORT`.

Sürüm takibi:
- Canlı sürüm: `curl -s http://localhost/api/health | jq -r .version` (imaj etiketi = git kısa SHA).
- Son iyi sürüm: `bozkir-next/.last-good-tag`; imajlar: `docker images | grep bozkir-app`.
- Manuel rollback: `APP_TAG=<önceki-sha> docker compose up -d`.

## Yedekleme (özet)

Tek komutla **tam yedek seti** (`backups/<tarih>/`):

| Dosya | İçerik | Kullanım |
| --- | --- | --- |
| `db.sql` | Mantıksal döküm (pg_dump) | Hızlı geri yükleme (`restore.sh`) |
| `storage.tar.gz` | SeaweedFS medya hacmi | Görseller/dosyalar |
| `base.tar.gz` | Fiziksel base backup (pg_backup_start/stop) | PITR tabanı |
| `wal-archive.tar.gz` | WAL arşiv anlık görüntüsü | PITR oynatma |
| `manifest.txt` | Meta bilgi | Kayıt |

```bash
cd /opt/bozkir-web/bozkir-next
./scripts/backup.sh                 # tam set (gece cron'u bunu çağırır)
./scripts/offsite-backup.sh         # ikinci VPS'e restic ile şifreli kopya
./scripts/verify-backup.sh          # tatbikat: geçici DB'ye geri yükle + sayım kontrolü
```

- **Saklama:** yerel 14 gün (`backup-cron.sh` budar); off-site restic: 7 günlük + 4 haftalık + 12 aylık.
- **Cron:** `deploy/crontab.example` dosyasını `crontab -e` ile uyarlayın. Gece 03:00 tam yedek + off-site, ayın 1'inde restore tatbikatı.
- **Sırlar:** `/etc/bozkir-backup.env` (chmod 600) → `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, `ALERT_WEBHOOK_URL`.

### Off-site (VPS2) kurulumu — bir kez

```bash
# VPS1'de:
apt-get install -y restic
ssh-keygen -t ed25519 -N "" -f /root/.ssh/bozkir_backup
ssh-copy-id -i /root/.ssh/bozkir_backup.pub backup@VPS2_IP

cat > /etc/bozkir-backup.env <<'EOF'
RESTIC_REPOSITORY=sftp:backup@VPS2_IP:/srv/bozkir-backup
RESTIC_PASSWORD=<güçlü-parola>          # parola yöneticisinde de saklayın
ALERT_WEBHOOK_URL=<slack/discord-webhook>  # opsiyonel
EOF
chmod 600 /etc/bozkir-backup.env

./scripts/offsite-backup.sh          # ilk çalıştırma depoyu başlatır
restic snapshots                     # doğrula
```

## PITR (zaman noktasına geri dönüş)

Postgres `wal_level=replica` + `archive_mode=on` ile çalışır; WAL segmentleri
`wal-archive` hacmine arşivlenir (`archive_timeout=300` → en fazla ~5 dk veri kaybı).
`backup.sh` her seferinde fiziksel base backup + WAL anlık görüntüsünü alır.

```bash
# 1) Uygun base backup'ı seç (backups/<tarih>/base.tar.gz + wal-archive.tar.gz)
# 2) Belirli bir ana dön (ör. yanlış veri silinmeden 2 dk önce):
./scripts/pitr-restore.sh ./backups/2026-10-01_0300 "2026-10-01 09:12:00+03"

# 3) En son WAL noktasına dön (zaman vermeden):
./scripts/pitr-restore.sh ./backups/2026-10-01_0300
```

- Script önce mevcut veriyi `backups/pre-pitr-restore-<tarih>/` altına kopyalar, sonra
  base backup'ı açar, WAL arşivini yerleştirir, `recovery.signal` + `restore_command`
  yazar, veritabanını kurtarma modunda başlatır ve promote edildiğini doğrular.
- `restore.sh` (mantıksal) hızlıdır ama PITR sağlamaz; son çare olarak kullanılır.

## Felaket Senaryoları

| Senaryo | İlk müdahale | RTO / RPO hedefi |
| --- | --- | --- |
| App çöktü (OOM/crash) | `docker compose up -d app`; nginx bakım sayfası devrede | ~2 dk / 0 |
| DB bozuldu / kötü migration | `restore.sh` (son mantıksal) veya `pitr-restore.sh` | 15–30 dk / ≤5 dk (PITR) |
| Yanlış deploy | Otomatik rollback (deploy işi) veya `APP_TAG=<önceki> up -d` | ~5 dk / 0 |
| Disk/VPS arızası | VPS2'den restic ile yedek çek, yeni VPS'te `restore.sh` + `storage.tar.gz` | 2–4 saat / ≤24 sa |
| Fidye yazılımı | VPS1 izole; VPS2'deki şifreli/immutable restic anlık görüntülerinden dön | 4–8 saat / ≤24 sa |
| Medya kaybı | `storage.tar.gz` geri yükle (DB'deki anahtarlar değişmez) | 30 dk / son yedek |
| Sır kaybı | Aşağıdaki "Sır envanteri" ile yeniden üret | 1–2 saat / — |
| Domain/DNS kesintisi | DNS sağlayıcı paneli; statik bakım sayfası ayrı hostta tutulabilir | değişken / — |

Acil durumda siteyi kapatmak için `MAINTENANCE_MODE=1 docker compose up -d app`.

## Sır Envanteri (kurtarma için)

| Değişken | Nerede | Kaybında |
| --- | --- | --- |
| `AUTH_SECRET` | `/opt/bozkir-web/bozkir-next/.env.local` + parola yöneticisi | Yeniden üret (≥32 karakter); tüm oturumlar geçersiz olur |
| `POSTGRES_PASSWORD` | `.env` (compose) + parola yöneticisi | DB şifresini değiştir; `DATABASE_URL` güncelle |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | `.env` | SeaweedFS ayarlarından yeniden üret |
| `RESTIC_PASSWORD` | `/etc/bozkir-backup.env` + parola yöneticisi | **Kaybında off-site yedekler açılamaz** — mutlaka yedekleyin |
| `VPS_SSH_KEY` | GitHub Secrets + parola yöneticisi | Yeni anahtar üret, GitHub'a ekle |
| Admin parolası | DB `admin_users` | `npm run admin:reset -- <kullanıcı> <yeni-şifre>` |

> `.env.local` ve `.env` **git'e girmez**. Kurulumdan sonra parola yöneticisine kopyalayın.

## Sağlık & İzleme

- **Hafif:** `GET /api/health` → `{ ok, uptime, version }`.
- **Derin:** `GET /api/health?deep=1` → DB + storage yoklanır; biri düşükse `503`.
- **Uptime Kuma** (opsiyonel profil): `docker compose --profile monitoring up -d` →
  `http://127.0.0.1:3001`, monitör: `http://app:3000/api/health?deep=1`.
  Dışarıdan: `https://www.bozkiragac.com/api/health?deep=1`. Bildirim için e-posta/Telegram webhook ayarlayın.
- **Webhook:** Ayarlar > Webhook URL tanımlıysa yeni tekliflerde `quote.created` POST edilir.

## VPS Optimizasyon Notları

- **nginx**: keepalive upstream, gzip, `/_next/static` + `/_next/image` + `/media` + `/catalog` 1 yıl immutable; API/login hız sınırı; `server_tokens off`.
- **Uygulama**: statik/ISR + `revalidate`; derin healthcheck; graceful shutdown; log rotation (`10m × 3`).
- **Postgres**: `shared_buffers=256MB`, `max_connections=100`, WAL arşivleme.
- **Docker**: `restart: unless-stopped`; app `stop_grace_period: 30s`.
- **Öneri (VPS boyutu)**: minimum 2 vCPU / 4 GB RAM; off-site VPS2 için 1 vCPU / 1 GB + disk yeterli.
- **TLS**: nginx önüne certbot; HSTS başlığı nginx snippet'inde.

## Sağlık Kontrolleri

| Kontrol | Komut |
| --- | --- |
| Servisler | `docker compose ps` |
| App (derin) | `curl -fsS "http://localhost/api/health?deep=1"` |
| DB | `docker exec bozkir-next-db-1 pg_isready -U bozkir` |
| WAL arşivi | `docker exec bozkir-next-db-1 psql -U bozkir -d bozkir -tAc "select last_archived_wal from pg_stat_archiver"` |
| Loglar | `docker compose logs -f app` |

## Bakım Modu

`MAINTENANCE_MODE=1 docker compose up -d app` → public trafik 503 ile bakım sayfasına gider
(`/api`, `/media`, `/admin`, `/maintenance`, statik dosyalar hariç). Kapatmak için `=0`.

**Uygulama çökerse:** nginx `error_page 502 504` ile statik `deploy/maintenance.html`
sayfasını servis eder (telefon/WhatsApp/e-posta, otomatik yenileme, TR/EN/AR).
Test: `docker stop bozkir-next-app-1 && curl -i http://localhost/tr && docker start bozkir-next-app-1`.

## Sık Karşılaşılan Sorunlar

- **Görsel 404:** `S3_PUBLIC_BASE_URL` ve nginx `/media` proxy'sini kontrol et.
- **Admin'e giriş yok:** `AUTH_SECRET` tanımlı mı; hesap `admin_users`'ta aktif mi.
- **Dil çalışmıyor:** `middleware.ts` matcher'ı ve `x-locale` başlığını kontrol et.
- **Teklif kaydedilmiyor:** `/api/teklif` logları + DB `quote_requests`.
- **WAL arşivi büyüyor:** `pg_stat_archiver` hatalarını kontrol et (`archive_command` yolu, hacim izni).
- **Rollback sonrası şema uyumsuz:** migrasyonlar eklemeli/idempotenttir; gerekirse `restore.sh`.

## Bakım

- `npm run db:migrate` — şema güncellemeleri (idempotent).
- `npm run admin:reset -- <kullanıcı> <şifre>` — yönetici hesabı sıfırla.
- `npm run media:normalize` — görsel URL'lerini anahtara indir (tek seferlik).

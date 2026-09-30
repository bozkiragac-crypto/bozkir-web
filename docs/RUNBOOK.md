# RUNBOOK — İşletim Notları

## Ortamlar

| Ortam | Nerede | Not |
| --- | --- | --- |
| Yerel | Geliştirici makinesi | `docker compose up -d db storage` + `npm run dev` |
| Üretim | VPS | `docker compose up -d --build` (db + storage + app + nginx) |

## Deploy

1. `main` branch'e push → GitHub Actions `deploy.yml` çalışır.
2. VPS'e SSH ile bağlanır, `git pull`, `docker compose up -d --build`.
3. Healthcheck: `GET /api/health?deep=1` başarılı olmalı.

Gerekli GitHub Actions secret'ları:
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH` (ör. `/opt/bozkir-web`).

## Sağlık & İzleme

- **Hafif:** `GET /api/health` → `{ ok, uptime, version }` (süreç ayakta mı).
- **Derin:** `GET /api/health?deep=1` → DB ve nesne depolamayı gerçekten yoklar;
  biri düşükse `503` + `{ db, storage }` durumu. Docker healthcheck bunu kullanır.
- **Uptime Kuma** (opsiyonel, compose profili):
  ```bash
  docker compose --profile monitoring up -d
  # Arayüz: http://127.0.0.1:3001
  # Monitör URL: http://app:3000/api/health?deep=1  (60sn aralık, 503 = down)
  ```
  Sunucu dışından izleme için ayrı bir Uptime Kuma instance'ından `https://www.bozkiragac.com/api/health?deep=1` izleyin.
- Loglar JSON formatında (`docker logs`) — log toplayıcılar tarafından okunabilir. `SENTRY_DSN` tanımlanırsa istemci/sunucu hataları Sentry'ye gider.
- **Webhook:** Ayarlar > Webhook URL tanımlıysa yeni tekliflerde JSON POST atılır (`quote.created`).

## VPS Optimizasyon Notları

- **nginx**: keepalive upstream, gzip, `/_next/static` + `/_next/image` + medya için 1 yıl immutable cache; API ve login için hız sınırı; `server_tokens off`.
- **Uygulama**: statik/ISR üretim + `revalidate`; derin healthcheck; graceful shutdown; log rotation (`10m × 3`).
- **Postgres**: `shared_buffers=256MB`, `max_connections=100`; `DB_POOL_MAX` uygulama tarafında sınırlanır.
- **Docker**: her serviste `json-file` log rotation; `restart: unless-stopped`; app `stop_grace_period: 30s`.
- **Öneri (VPS boyutu)**: minimum 2 vCPU / 4 GB RAM. Docker build için ek geçici bellek.
- **TLS**: nginx önüne certbot; sonrasında HSTS başlığı eklenebilir.

## Sağlık Kontrolleri

| Kontrol | Komut |
| --- | --- |
| Servisler | `docker compose ps` |
| App (derin) | `curl -fsS "http://localhost/api/health?deep=1"` |
| DB | `docker exec bozkir-next-db-1 pg_isready -U bozkir` |
| Loglar | `docker compose logs -f app` |

## Bakım Modu

Siteyi geçici olarak kapatmak için `bozkir-next/.env` (veya compose env) içinde
`MAINTENANCE_MODE=1` ayarlayıp app'i yeniden başlatın:
```bash
MAINTENANCE_MODE=1 docker compose up -d app
# kapatmak için: MAINTENANCE_MODE=0 docker compose up -d app
```
`/api`, `/media`, `/admin`, `/maintenance` ve statik dosyalar hariç tüm public
trafik bakım sayfasına (HTTP 503) yönlenir. Yedek olarak nginx statik sayfası:
`deploy/maintenance.html`.

## Yedek / Geri Yükleme

```bash
# Tam yedek (DB + medya) — ./backups/<tarih>/ altına
./scripts/backup.sh

# Geri yükle (mevcut veriyi SİLER; onay ister)
./scripts/restore.sh ./backups/2026-09-30_1200
```

Otomatik yedek (VPS crontab örneği):
```cron
0 3 * * * cd /opt/bozkir-web/bozkir-next && ./scripts/backup.sh >> /var/log/bozkir-backup.log 2>&1
```
Yedekleri düzenli olarak harici bir konuma (S3/başka sunucu) kopyalayın.

## Felaket Kurtarma (özet)

1. Servisleri başlat: `docker compose up -d`.
2. `GET /api/health?deep=1` → hangi bileşen düştü (db/storage).
3. DB bozuksa: son yedeği `scripts/restore.sh` ile geri yükle.
4. Kod hatasıysa: `git reset --hard <önceki-sha> && docker compose up -d --build` (rollback).
5. Uzun kesinti riski varsa bakım modunu aç.

## Veritabanı Yedek / Geri Yükleme

```bash
# Yedek al (VPS veya yerel)
docker exec bozkir-next-db-1 pg_dump -U bozkir bozkir > backup-$(date +%F).sql

# Geri yükle
cat backup-YYYY-MM-DD.sql | docker exec -i bozkir-next-db-1 psql -U bozkir bozkir
```

## Medya Yedek (SeaweedFS)

```bash
# storage hacmini tar'la
docker run --rm -v bozkir-next_storage-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/storage-$(date +%F).tar.gz -C /data .
```

## Sağlık Kontrolleri

| Kontrol | Komut |
| --- | --- |
| Servisler | `docker compose ps` |
| App | `curl -s http://localhost/api/health` |
| DB | `docker exec bozkir-next-db-1 pg_isready -U bozkir` |
| Loglar | `docker compose logs -f app` |

## Sık Karşılaşılan Sorunlar

- **Görsel 404:** `S3_PUBLIC_BASE_URL` ve nginx `/media` proxy'sini kontrol et.
- **Admin'e giriş yok:** `AUTH_SECRET` tanımlı mı; hesap `admin_users`'ta aktif mi.
- **Dil çalışmıyor:** `middleware.ts` matcher'ı ve `x-locale` başlığını kontrol et.
- **Teklif kaydedilmiyor:** `/api/teklif` logları + DB `quote_requests`.

## Bakım

- `npm run db:migrate` — şema güncellemeleri (idempotent).
- `npm run admin:reset -- <kullanıcı> <şifre>` — yönetici hesabı sıfırla.
- `npm run media:normalize` — görsel URL'lerini anahtara indir (tek seferlik).

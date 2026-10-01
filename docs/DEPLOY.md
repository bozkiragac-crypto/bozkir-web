# Deployment (VPS / Docker Compose)

Hedef: Next uygulamasını Docker Compose ile çalıştırmak (nginx arkasında, Postgres + SeaweedFS).

## 1. Sunucu gereksinimleri
- Docker + Docker Compose v2
- 2 vCPU / 4 GB RAM önerilir (build için geçici ek bellek)
- Alan adı + TLS (certbot) — nginx Docker dışında mı içinde mi olacağına karar verin
- Off-site yedek için ikinci küçük VPS (restic deposu)

## 2. Kurulum
```bash
git clone <repo> /opt/bozkir-web
cd /opt/bozkir-web/bozkir-next
cp .env.example .env.local            # değerleri doldur (aşağıya bakın)
docker compose up -d                  # db + wal-init + storage + app + nginx
```

Gerekli ortam değişkenleri (`.env.local` + compose `.env`):
- `NEXT_PUBLIC_SITE_URL`, `SITE_URL`
- `POSTGRES_USER/PASSWORD/DB`, `DATABASE_URL`
- `AUTH_SECRET` (≥32 rastgele karakter)
- `S3_*` (SeaweedFS)
- Opsiyonel: `NEXT_PUBLIC_ANALYTICS_ID`, `QUOTE_RATE_LIMIT_MAX`
- Off-site: `/etc/bozkir-backup.env` → `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, `ALERT_WEBHOOK_URL`

## 3. Otomatik dağıtım (GitHub Actions)
1. `main`'e push → **CI** (lint, typecheck, unit, build, E2E).
2. CI yeşilse **Deploy (VPS)** çalışır: migrasyon öncesi yedek → sürümlü imaj (`bozkir-app:<sha>`) → migrate + seed → derin healthcheck.
3. Sağlık kontrolü başarısızsa **önceki sürüme otomatik rollback**.

GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PATH` (ör. `/opt/bozkir-web`), opsiyonel `VPS_PORT`.

Manuel sürüm/rollback:
```bash
APP_TAG=<git-sha> docker compose up -d       # belirli sürüm
cat .last-good-tag                            # son sağlıklı sürüm
APP_TAG=<son-iyi-sha> docker compose up -d    # geri dön
```

## 4. nginx + TLS
Docker nginx yalnızca `:80` dinler; TLS'i önüne certbot'lu host nginx veya bir edge proxy koyun:
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bozkiragac.com
sudo ln -s /etc/nginx/sites-available/bozkiragac.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d bozkiragac.com -d www.bozkiragac.com
sudo nginx -t && sudo systemctl reload nginx
```

## 5. DNS geçişi
- `A` kaydını VPS IP'sine yönlendir; `www` için de aynı.
- Eski host'u doğrulayana kadar rollback için kapatmayın.

## 6. Yedek & Felaket Kurtarma
Kurulumdan sonra mutlaka:
```bash
./scripts/backup.sh           # tam set (db + medya + PITR tabanı)
./scripts/verify-backup.sh    # restore tatbikatı
./scripts/offsite-backup.sh   # ikinci VPS'e şifreli kopya
```
Cron için `deploy/crontab.example`; ayrıntılı senaryolar ve PITR için `docs/RUNBOOK.md`.

## 7. Doğrulama
- `/`, `/urunler`, `/admin/login`, `/sitemap.xml`, `/robots.txt`
- Ürün görselleri (`/media/...`) ve teklif formu (`/admin/teklifler`)
- `curl -fsS http://localhost/api/health?deep=1` → `{ ok: true, db: ok, storage: ok }`
- `curl -I` ile güvenlik başlıkları (CSP, HSTS, nosniff)

## Notlar
- Self-hosted yığın: Postgres + SeaweedFS (S3). Şema `docker/initdb/01-schema.sql` + `scripts/db-migrate.mjs` (idempotent).
- Görsel URL'leri DB'de anahtar olarak tutulur; public taban `S3_PUBLIC_BASE_URL` ile verilir.
- PITR: WAL segmentleri `wal-archive` hacmine arşivlenir (`archive_timeout=300`).
- Ortam değişkenleri gizlidir; `.env.local`/`.env` git'e girmez — parola yöneticisinde saklayın (bkz. RUNBOOK "Sır Envanteri").

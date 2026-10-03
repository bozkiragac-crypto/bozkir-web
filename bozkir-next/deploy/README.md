# Deployment (VPS / Node)

> **Önerilen yol (Docker + nginx + Let's Encrypt):** adım adım kurulum için
> **[PRODUCTION.md](./PRODUCTION.md)** dosyasına bakın. Bu dosya o yolun
> (Docker, TLS, yedekleme, Cloudflare, rollback) referansıdır; aşağıdaki bölüm
> Docker'sız, doğrudan Node + host nginx kurulumu içindir.

Hedef: Next uygulamasını Node runtime ile çalıştırmak (nginx arkasında). PHP artık yok.

## 1. Sunucu gereksinimleri
- Node.js 22 LTS
- nginx (ters proxy + TLS)
- (opsiyonel) pm2 veya Docker

## 2. Kurulum
```bash
git clone <repo> /var/www/bozkir-site
cd /var/www/bozkir-site/bozkir-next
cp .env.production.example .env.local   # değerleri doldur
npm ci
npm run build
```

## 3. Çalıştırma
**pm2:**
```bash
npm i -g pm2
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup
```

**Docker:**
```bash
docker build -t bozkir-next .
docker run -d --name bozkir-next --env-file .env.local -p 3000:3000 bozkir-next
```

## 4. nginx + TLS
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bozkiragac.com
sudo ln -s /etc/nginx/sites-available/bozkiragac.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d bozkiragac.com -d www.bozkiragac.com
sudo nginx -t && sudo systemctl reload nginx
```

## 5. DNS geçişi
- `A` kaydını VPS IP'sine yönlendir.
- Eski PHP host'u bir süre **rollback** için kapatmadan tut, doğrulayınca kaldır.

## 6. Doğrulama
- `/`, `/urunler`, `/admin/login`, `/sitemap.xml`, `/robots.txt`
- Ürün görselleri (`/media/...` → storage) ve teklif formu (`/admin/teklifler`)
- `curl -I` ile güvenlik başlıkları

## Notlar
- Self-hosted yığın: Postgres + SeaweedFS (S3). Kurulum `docker/initdb/01-schema.sql` ile otomatik.
- Görsel URL'leri DB'de anahtar olarak tutulur; public taban `S3_PUBLIC_BASE_URL` ile verilir.
- Tek seferlik göç: `npm run media:normalize` (mutlak URL → anahtar).
- Ortam değişkenleri gizlidir; `.env.local` git'e girmez.

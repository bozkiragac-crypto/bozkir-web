# Bozkır Ağaç Ürünleri — Monorepo

Bu depo, Bozkır Ağaç Ürünleri web projesini barındırır.

| Yol | Açıklama |
| --- | --- |
| **`bozkir-next/`** | **Aktif uygulama.** Next.js 15 (App Router) + React 19 + TypeScript + PostgreSQL 16 + SeaweedFS (S3 uyumlu). Site, yönetim paneli, JSON API'si ve teklif formu. |
| `docs/` | Dokümantasyon: kurulum, mimari, deploy, runbook. |
| `archive/` | Emekliye ayrılmış legacy içerik (eski PHP sitesi, dönüşüm araçları, ham görseller). Git tarafından **izlenmez**. Silinmez; gerekirse geri dönüş için tutulur. |

## Hızlı Başlangıç

```bash
cd bozkir-next
cp .env.docker.example .env            # compose değişkenleri
cp .env.production.example .env.local  # uygulama değişkenleri (değerleri doldur)
docker compose up -d --build
```

- Site: <http://localhost>
- Sağlık kontrolü: <http://localhost/api/health?deep=1> (veritabanı + depolama + görsel denetimi)
- İlk yönetici: `ADMIN_USERNAME` ve `ADMIN_SEED_PASSWORD` ayarlayıp `npm run db:seed`

Ayrıntılı kurulum, mimari ve deployment: [`docs/README.md`](docs/README.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Servisler (Docker Compose)

| Servis | Port | Açıklama |
| --- | --- | --- |
| `nginx` | `80` (prod'da `443`) | Ters vekil, güvenlik başlıkları, hız sınırlama, bakım sayfası |
| `app` | `3000` (yalnızca iç ağ) | Next.js sunucusu, `node` kullanıcısı ile çalışır |
| `db` | `127.0.0.1:5432` | PostgreSQL 16 + WAL arşivi |
| `storage` | `127.0.0.1:8333` | SeaweedFS S3 uç noktası (görseller, teklif ekleri) |
| `uptime-kuma` | `127.0.0.1:3001` | İç izleme paneli |

## Komutlar

| Komut | İşlev |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi / sunucusu |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript denetimi |
| `npm test` | Birim testleri (Vitest) |
| `npm run test:e2e` | Uçtan uca testler (Playwright, Chromium + mobil) |
| `npm run db:migrate` | Şema değişikliklerini uygular |
| `npm run db:seed` | Yönetici hesabını oluşturur/günceller |
| `npm run admin:reset -- <kullanıcı> <parola>` | Yönetici parolasını sıfırlar |
| `npm run media:audit` | Tüm görsel referanslarını depoya karşı doğrular |

## Testler ve kalite

`main` dalına push olduğunda `.github/workflows/ci.yml` sırasıyla **lint → typecheck → birim testler → build → E2E** çalıştırır. Yerelde aynı kontroller:

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run test:e2e     # Docker servisleri ayaktayken
```

## Üretim dağıtımı

- **Otomatik:** `.github/workflows/deploy.yml` — `main` push → VPS'e SSH ile **yedek alır → imajı etiketleyip derler → migration çalıştırır → sağlık kontrolü yapar**. Sağlık başarısız olursa önceki imaja otomatik döner.
- **TLS:** `bozkir-next/docker-compose.prod.yml` + `bozkir-next/deploy/nginx.docker.tls.conf` (443, Let's Encrypt, ACME webroot).
- **Adım adım kurulum ve go-live kontrol listesi:** [`bozkir-next/deploy/PRODUCTION.md`](bozkir-next/deploy/PRODUCTION.md).

## Yedekleme

`bozkir-next/scripts/` altındaki `backup.sh` (veritabanı + depo), `offsite-backup.sh` (restic ile uzak kopya) ve `pitr-base-backup.sh` (WAL tabanlı PITR) çalıştırılır. `deploy/crontab.example` örnek zamanlama sunar; yedekler düzenli olarak **geri yüklenerek test edilmelidir**.

## Notlar

- `products.code` bir **seri/malzeme kodu**dur, tekil değildir (örneğin `PVC KENAR` kategorisindeki tüm ürünler `PVC` kodunu taşır). Benzersizlik yerine `(kategori + kod + ad)` üçlüsü kontrol edilir.
- Bir ürünün `img` değeri boşsa arayüz kırık görsel yerine düzgün bir placeholder gösterir; `npm run media:audit` eksik referansları tek komutla bulur.
- `archive/` ve tüm legacy dosyalar git dışıdır; ana depo bu sayede hafif kalır.
- Sırlar (`.env.local`) git'e girmez. VPS ve GitHub Actions için ayrı secret yönetimi kullanılır.
# Bozkır Ağaç Ürünleri — Full-Stack Web

Next.js App Router tabanlı dijital malzeme showroom'u. **Supabase, PHP ve harici bağımlılık yoktur**;
tüm yığın kendi sunucunuzda Docker ile çalışır.

## Teknoloji

- **Next.js 15 (App Router) + React 19 + TypeScript (strict)**
- **Tailwind CSS v4** (CSS-first tasarım token'ları)
- **PostgreSQL 16** + **Drizzle ORM**
- **SeaweedFS** (S3 uyumlu nesne depolama) — görseller
- **GSAP + ScrollTrigger + @gsap/react**, **Lenis** (smooth scroll senkronu)
- **Three.js + @react-three/fiber** (panel kesiti — lazy, fallback'li)
- **React Hook Form + Zod**, **Lucide** ikonları
- Admin oturumu: bcryptjs + `jose` (HS256 JWT, httpOnly cookie)

## Hızlı başlangıç (Docker — önerilen)

```bash
cd bozkir-next
cp .env.docker.example .env            # compose değişkenleri
cp .env.production.example .env.local  # uygulama değişkenleri (değerleri doldur)
docker compose up -d --build
```

- Site: `http://localhost/` (nginx → app)
- Medya: `http://localhost/media/<anahtar>` (nginx → storage)
- Postgres/SeaweedFS yalnızca `127.0.0.1`'e açılır (bakım için).

İlk kurulum (bir kez):
```bash
npm run db:push                     # şema (alternatif: docker/initdb otomatik çalışır)
npm run storage:init                # medya bucket'ı
npm run db:migrate                  # mevcut DB'yi güncel şemaya taşır (idempotent)
npm run admin:reset -- bozkir "Sifre"   # tek yönetici hesabı (diğerlerini siler)
```

## Yerel geliştirme (Docker olmadan)

```bash
npm install
docker compose up -d db storage   # yalnızca altyapı
npm run storage:init
npm run dev                       # http://localhost:3000
```

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm run start` | Üretim derlemesi / sunucusu |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |
| `npm run db:push` | Drizzle şemasını uygula |
| `npm run db:migrate` | Mevcut veritabanını güncel şemaya taşır (tekrar çalıştırılabilir) |
| `npm run db:seed-content` | İçerik blokları + öğeleri için TR/EN/AR çeviri tohumlaması (idempotent) |
| `npm run db:seed-meta` | Kategori ve marka tohumlaması (fallback verisinden, idempotent) |
| `npm run test` | Vitest birim testleri |
| `npm run test:e2e` | Playwright uçtan uca testleri (BASE_URL veya webServer) |
| `npm run admin:reset -- <kullanıcı> <şifre>` | Tüm yönetici hesaplarını siler, verilen hesabı `owner` olarak oluşturur |
| `npm run db:seed -- <kullanıcı> <şifre>` | Var olan yöneticiyi günceller / oluşturur |
| `npm run storage:init` | Medya bucket'ını oluştur |
| `npm run media:normalize` | DB görsel URL'lerini anahtara indir (tek seferlik) |
| `npm run import:missing-images -- <klasör>` | Görseli olmayan ürünlerin kapaklarını eşleştirip yükler |

## Ortam değişkenleri

**Compose (`.env`)**: `POSTGRES_*`, `S3_*`, `S3_PUBLIC_BASE_URL`, `SITE_URL`.
**Uygulama (`.env.local`)**: `DATABASE_URL`, `AUTH_SECRET`, `S3_*`, `NEXT_PUBLIC_*`.

`S3_PUBLIC_BASE_URL`: tarayıcının gördüğü medya tabanı. Üretimde `https://www.bozkiragac.com/media`
(nginx `/media` → storage) veya göreli `/media`. Yerelde `http://localhost:8333/bozkir-media`.

## Veri katmanı

Frontend `lib/api/*` üzerinden konuşur; arkasındaki kaynak değişebilir (mimari korunur).

- **Varsayılan (yerel):** `NEXT_PUBLIC_API_URL` boşken sunucu bileşenleri doğrudan `src/lib/data/*`
  katmanından (Drizzle/Postgres) okur.
- **JSON API (aynı uygulama):** `src/app/api/{products,product,categories,content,campaigns,image}`
  route'ları aynı sözleşmeleri sunar.
- **Görseller:** DB'de yalnızca nesne **anahtarı** tutulur (`products/<id>/1.webp`); public URL
  `S3_PUBLIC_BASE_URL`'den üretilir. Böylece alan adı/ortam değişse de bağlantı bozulmaz.

## Yönetim paneli (`/admin`)

- Giriş: **kullanıcı adı + şifre** (bcrypt). Hesaplar `admin_users` tablosundadır; e-posta beyaz listesi
  yoktur. `/admin/*` middleware ile korunur ve `noindex`'tir.
- **Giriş sonrası her istek DB'den doğrulanır** (hesap aktif mi), tüm yazma işlemleri `activity_log`
  tablosuna kaydedilir.
- **Panel (dashboard):** ürün/aktif ürün/kampanya/içerik/teklif/kullanıcı sayıları, 14 günlük teklif
  grafiği, son teklifler, son aktiviteler.
- **Ürünler:** arama, kategori/durum filtresi, sıralama, sayfalama, kapak önizleme, tek ürün veya
  **toplu seçim ile silme**, **aktif/pasif** anahtarı, **CSV dışa/içe aktarma** (önizleme destekli).
- **Medya kütüphanesi:** SeaweedFS'i klasör klasör gezin, önizle, yükle, sil; silinen anahtarlar
  ürünlerde kullanılıyorsa uyarır.
- **Kullanıcılar:** ekle/düzenle/sil, rol (`owner` / `editor`), aktiflik, şifre değiştirme, son giriş.
  Son `owner` hesabı ve kendi hesabınız silinemez.
- **Site ayarları:** telefon, WhatsApp, e-posta, çalışma saatleri, adres, sosyal hesaplar ve
  **anasayfa vitrin kategori sırası** — kaydedilen değerler footer/iletişim/teklif ekranına anında yansır.
- **Aktivite:** tüm yönetici işlemlerinin kronolojik kaydı.
- **Kampanyalar / İçerik / Teklifler:** başlık, metin, link, sıra, aktiflik, tarih aralığı + görsel.

## Teklif formu

`/api/teklif` sunucu route'u; honeypot + IP rate-limit içerir. Talepler **yalnızca veritabanına**
yazılır ve `/admin/teklifler` üzerinden görüntülenir (harici servis yoktur).

Ürün sayfasındaki **Teklif Al** CTA'sı ürünü forma bağlar: `/teklif-al?urun=<slug>`. Karşılaştırma
sayfasındaki **Toplu Teklif Al** ise `/teklif-al?urunler=<slug1>,<slug2>,...` kullanır. Formda seçili
ürünler rozet olarak listelenir, tek tek kaldırılabilir; kayıt `product_id` / `product_slug`
alanlarına yazılır ve admin listesinden ürün sayfasına geri link verilir.

## Favori & karşılaştırma

- Tarayıcı `localStorage` (`bozkir:favorites`, `bozkir:compare`) — sunucu/hesap gerektirmez.
- **Favori:** ürün kartı/ürün sayfası kalp butonu → `/favoriler` (en fazla 24 ürün).
- **Karşılaştırma:** terazi butonu → sabit alt çubuk, **en fazla 4 ürün** → `/karsilastir`
  (kod/kategori/yüzey/kalınlık karşılaştırma tablosu, toplu teklif CTA'sı).
- Karşılaştırma çubuğu açıkken WhatsApp butonu yukarı kayar (`--compare-h`) ve ürün sayfasındaki
  sabit mobil CTA gizlenir.

## Deployment (özet)

```bash
docker compose up -d --build
```
TLS için nginx önüne certbot (`--nginx`) ekleyin; `SITE_URL` ve `S3_PUBLIC_BASE_URL` alan adına
göre ayarlayın. Ayrıntı: `deploy/README.md`.

## Durum

- [x] Tasarım sistemi, header/mega menü/arama, hero, material story, yatay vitrin, 3D kesit
- [x] Alt sayfalar: ürünler, kategori, ürün detay, hakkımızda, bayilikler, katalog, iletişim, teklif
- [x] Self-hosted Postgres + SeaweedFS; 248 ürün, tamamında görsel
- [x] Teklif formu (DB kaydı + dosya eki S3'e yükleme) + admin teklif ekranı
- [x] SEO: metadata, JSON-LD, sitemap (ürün+kategori), robots, hreflang
- [x] Full-stack Docker (db + storage + app + nginx)
- [x] Kullanıcı adı tabanlı yönetici girişi + kullanıcı yönetimi
- [x] Gelişmiş analitik panel, medya kütüphanesi, site ayarları, aktivite kaydı
- [x] Gelişmiş ürün yönetimi (filtre/sıralama/toplu silme/aktiflik/CSV)
- [x] Malzeme Vitrini yönetimi (admin `/admin/vitrin`) + ürün mozaik ızgarası
- [x] Üründen tek tıkla teklif (ürün bağlantısı + admin'de geri link)
- [x] Favoriler ve 4 ürüne kadar karşılaştırma (localStorage)
- [x] Ürün WhatsApp paylaşımı
- [x] Çok dilli altyapı (TR/EN/AR + RTL) — DB içerik çevirileri (ürün/kategori/kampanya/içerik/katalog)
- [x] Katalog admin CRUD + PDF yükleme (`/admin/kataloglar`)
- [x] Depo konumu + çok dilli çalışma saatleri
- [x] Test altyapısı (Vitest + Playwright) + GitHub Actions CI/CD
- [x] Dayanıklılık: derin sağlık kontrolü (DB+S3), graceful shutdown, yedek/restore scriptleri, bakım modu, hata log'u
- [x] Statik/ISR üretim (SSG) + gelişmiş SEO (JSON-LD, breadcrumb, hreflang, og:image) + a11y (inert, focus trap)
- [x] Kategori & marka admin CRUD; Hakkımızda içeriği admin; çoklu katalog listeleme

## Test

```bash
npm run test        # Vitest (birim)
npm run test:e2e    # Playwright (uçtan uca)
```

## Deployment (özet)

`main` branch'e push → GitHub Actions → VPS `git pull` + `docker compose up -d --build`.
Ayrıntı: [`../docs/RUNBOOK.md`](../docs/RUNBOOK.md), [`../docs/DEPLOY.md`](../docs/DEPLOY.md).

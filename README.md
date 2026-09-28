# Bozkır Ağaç Ürünleri — Yeni Nesil Frontend

Mevcut PHP sitesinden **tamamen bağımsız** çalışan, Next.js App Router tabanlı dijital malzeme
showroom'u. PHP uygulaması yalnızca **veri katmanı** (JSON API) olarak kullanılır; Next tarafı
bu API'ye `lib/api` üzerinden bağlanır ve backend değişirse yalnızca o katman güncellenir.

## Teknoloji

- **Next.js 15 (App Router) + React 19 + TypeScript (strict)**
- **Tailwind CSS v4** (CSS-first tasarım token'ları)
- **GSAP + ScrollTrigger + @gsap/react**, **Lenis** (smooth scroll senkronu)
- **Three.js + @react-three/fiber** (panel kesiti — lazy, fallback'li)
- **React Hook Form + Zod**, **Lucide** ikonları

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
```

Ürün verisi için PHP API'nin çalışıyor olması gerekir (bkz. aşağıdaki bölüm).

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm run start` | Üretim derlemesi / sunucusu |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |

## Ortam değişkenleri

`.env.local` (git'e girmez):

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000        # canlıda: https://www.bozkiragac.com
NEXT_PUBLIC_API_URL=http://127.0.0.1:8789/api     # canlıda: https://www.bozkiragac.com/api
NEXT_PUBLIC_ANALYTICS_ID=                          # GA4 kimliği (boşsa analytics kapalı)
TELEGRAM_BOT_TOKEN=...                             # yalnızca sunucu (teklif formu)
TELEGRAM_CHAT_ID=...
```

## PHP JSON API (`../api/`)

Salt-okunur, CORS açık, `Cache-Control: max-age=300`.

| Uç nokta | Açıklama |
| --- | --- |
| `GET /api/categories` | Kategori listesi + ürün sayısı |
| `GET /api/products?category=&q=&limit=&offset=` | Ürün listesi (sayfalı) |
| `GET /api/product?slug=` | Tek ürün |
| `GET /api/image.php?id=<uuid>` | base64 görseli ilk istekte diske yazar (`img/cache/`), sonra dosyadan servis eder |

- `cache/api-products-index.json` meta indeksidir (görsel içermez, 1 saat TTL).
- `.htaccess` temiz-URL kuralı `/api/products` → `api/products.php` eşlemesini yapar.

## Mimari notlar

- Varsayılan **Server Component**; animasyon/etkileşim gereken bileşenler `'use client'`.
- `/kategoriler/[slug]`, `/urunler/[slug]` ve `/sitemap.xml` **ISR** (`revalidate = 300/600`).
- Teklif formu, token'ı istemciye sızdırmadan **sunucu route'u** (`/api/teklif`) üzerinden
  Telegram'a gönderir; honeypot + IP rate-limit içerir.
- görseller `next/image` (AVIF/WebP) ile optimize edilir; API görselleri `remotePatterns` ile izinlidir.

## Durum

- [x] Tasarım sistemi, header/mega menü/arama, hero, material story, yatay vitrin, 3D kesit
- [x] Alt sayfalar: ürünler, kategori, ürün detay, kurumsal, bayilikler, katalog, iletişim, teklif
- [x] PHP JSON API + tembel görsel servisi, gerçek 216 ürün
- [x] Teklif formu (Telegram, sunucu tarafı), favicon/manifest/OG, KVKK/Gizlilik/Çerez taslakları
- [x] SEO: metadata, JSON-LD (Organization/Product/Breadcrumb), sitemap (ürün+kategori), robots

## Sonraki adımlar

- [ ] Gerçek ürün görsellerinin profesyonel çekimi (bazıları hâlâ temsili/eksik)
- [ ] Ek kataloglar (AGT / Teverpan / HSÇ / Apel)
- [ ] Lighthouse turu ve görsel/PDF boyut optimizasyonu
- [ ] DNS geçişi: staging → production

## Deployment (özet)

1. `bozkir-next` klasörünü Vercel/Cloudflare'e bağla (Node runtime).
2. Ortam değişkenlerini tanımla (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, Telegram anahtarları).
3. PHP tarafında `api/` klasörünün yayında olduğundan ve `img/cache` yazılabilir olduğundan emin ol.
4. Domain geçişinden sonra sitemap'i Search Console'a bildir ve eski URL'ler için 301'leri doğrula.

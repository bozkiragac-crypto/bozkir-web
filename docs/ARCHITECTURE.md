# Mimari

## Genel Bakış

```
Tarayıcı
  │
  ▼
nginx (TLS, /media proxy, rate-limit)
  │
  ├─▶ Next.js (App Router) ──▶ PostgreSQL (Drizzle ORM)
  │        │
  │        └─▶ SeaweedFS (S3 uyumlu nesne depolama — görseller/PDF)
  │
  └─▶ /media/* ──▶ SeaweedFS
```

- **Next.js 15 (App Router) + React 19 + TypeScript (strict)**
- **Tailwind CSS v4** (CSS-first tasarım token'ları)
- **PostgreSQL 16** + **Drizzle ORM**
- **SeaweedFS** (S3 uyumlu nesne depolama)
- **GSAP + ScrollTrigger + Lenis** (animasyon + smooth scroll)
- **Three.js + @react-three/fiber** (panel kesiti — lazy, fallback'li)
- **React Hook Form + Zod**, **Lucide** ikonları
- Admin oturumu: bcryptjs + `jose` (HS256 JWT, httpOnly cookie)

## Klasör Yapısı (`bozkir-next/src`)

```
src/
├─ app/
│  ├─ [locale]/(site)/     # Public site (i18n: tr/en/ar)
│  ├─ admin/               # Yönetim paneli (yalnızca TR)
│  ├─ api/                 # JSON / teklif / health route'ları
│  ├─ media/[...key]/      # Medya proxy (self-hosted)
│  ├─ globals.css, layout dışı dosyalar (robots, sitemap, manifest)
│  └─ (public/admin için ayrı root layout)
├─ components/
│  ├─ admin/               # Panel bileşenleri
│  ├─ home/                # Anasayfa bölümleri
│  ├─ layout/              # Header / footer / nav / tema / dil
│  ├─ products/            # Ürün kart/butonlar
│  ├─ catalog/, campaigns/, forms/, three/, ui/, animations/, providers/
├─ lib/
│  ├─ api/                 # Servis katmanı (bileşenler bunu kullanır)
│  ├─ data/                # DB erişimi (Drizzle) + önbellek
│  ├─ db/                  # client + schema
│  ├─ auth/                # session + token
│  ├─ admin/               # guard + activity log
│  ├─ storage/             # S3 (SeaweedFS)
│  ├─ i18n/                # (üst seviye i18n/)
│  └─ seo.ts, media.ts, phone.ts, image.ts, utils.ts, gsap.ts
├─ i18n/                   # config, dictionaries, server, provider
├─ types/                  # Ortak tipler
├─ config/ data/ hooks/
└─ middleware.ts           # /admin koruması + dil yönlendirmesi
```

## Veri Katmanı

Bileşenler doğrudan fetch çağırmaz; `lib/api/*` servis katmanını kullanır.

- **Yerel (varsayılan):** `NEXT_PUBLIC_API_URL` boşken sunucu bileşenleri doğrudan `lib/data/*` (Drizzle/Postgres) okur.
- **JSON API:** `src/app/api/{products,product,categories,content,campaigns,catalogs,image}` aynı sözleşmeleri sunar.
- **Görseller:** DB'de yalnızca nesne **anahtarı** tutulur (`products/<id>/1.webp`); public URL `S3_PUBLIC_BASE_URL`'den üretilir.

## Çok Dillilik (i18n)

- Desteklenen diller: `tr` (varsayılan), `en`, `ar` (RTL).
- Tüm public URL'ler dil öneklidir: `/tr/...`, `/en/...`, `/ar/...`.
- Sözlükler `src/i18n/dictionaries.ts`; sunucu bileşenleri `getServerDictionary()`, istemci bileşenleri `useDictionary()`.
- DB tabanlı içerikler `*_en` / `*_ar` kolonlarıyla çevrilir; boşsa Türkçeye düşer (ürün, kategori, kampanya, içerik bloğu/öğesi, katalog).
- `hreflang` + canonical + sitemap dil alternatifleri otomatik üretilir (`lib/seo.ts`).

## Güvenlik

- `/admin/*` middleware + her istekte DB doğrulaması.
- Teklif formu: honeypot + rate-limit (nginx + uygulama fallback).
- Güvenlik başlıkları `next.config.mjs` + nginx.
- Sırlar yalnızca ortam değişkenlerinde; git'e girmez.

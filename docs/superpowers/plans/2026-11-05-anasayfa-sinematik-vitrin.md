# Ana Sayfa "Sinematik Vitrin" Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ana sayfayı 18 bölümden 14'e indirip, baştan sona karanlık sinematik bir vitrine dönüştürmek; içerik, SEO ve admin düzenlenebilirliği korunarak.

**Architecture:** Karanlık tema, mevcut `[data-theme='dark']` token bloğuna `[data-night]` seçicisi eklenerek ana sayfaya kapsanır. Bölüm azaltma, mevcut bileşenlere `bare` prop'u eklenip yeni birleşik sarmalayıcılarda (Uygulama & Rehber, Manifesto & Sayılar, Referans & Markalar) yeniden kullanılarak yapılır. Ritim üç boşluk seviyesine ayrılır; pinning yalnızca `lg+` çalışır.

**Tech Stack:** Next.js App Router (RSC), TypeScript, Tailwind v4 (`@theme` tokenları), GSAP + ScrollTrigger, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-03-anasayfa-sinematik-vitrin-design.md`

## Global Constraints

- Karanlık tema **yalnızca ana sayfada**; diğer sayfalar açık tema kalır.
- Mevcut görseller ve DB içeriği kullanılır; yeni medya eklenmez.
- GSAP korunur; yeni animasyon kütüphanesi eklenmez.
- Admin panelindeki hiçbir alan kaldırılmaz/yeniden adlandırılmaz.
- Mevcut URL'ler, canonical'lar ve JSON-LD türleri korunur.
- `prefers-reduced-motion: reduce` tüm hareketlerde saygı görür.
- `lg` (1024px) altında hiçbir bölüm pinlenmez.
- Bölüm id'leri korunur: `malzeme`, `vitrin`, `surec`, `sss`; yeni: `uygulama`, `manifesto`, `katalog`, `referanslar`, `lojistik`, `teklif`.
- Tipografi tokenları: H1 `clamp(2.6rem, 7.2vw, 6.5rem)`, H2 mevcut `.text-section`.

## Review Focus

- Koyu zeminde `text-muted` (`#8f8f98`) küçük metinler AA altına düşebilir → her yeni koyu bölümde kontrast ≥ 4.5:1 doğrulanmalı.
- Mobilde yatay kaydırmalı alanlar (malzeme kartları, vitrin) keşfedilebilir olmalı → kısmi kart (peek) + gösterge.
- Ana sayfadan diğer sayfalara geçişte karanlık→açık sıçraması → `page-fade` korunur, header koyu kalır.
- Bölüm birleştirmelerinde içerik bloğu boşsa (admin verisi yok) bölüm başlığı tek başına kalmamalı → erken `return null`.
- `data-night` altında `color-scheme: dark` form kontrollerini (varsa) etkiler → ana sayfada form yok, doğrulanacak.

---

### Task 1: Karanlık tema kapsamı + header davranışı

**Files:**
- Modify: `bozkir-next/src/app/globals.css:107` (koyu token seçicisi)
- Modify: `bozkir-next/src/app/[locale]/(site)/page.tsx` (sarmalayıcı)
- Modify: `bozkir-next/src/components/layout/Header.tsx:121-135` (koyu header)

**Interfaces:**
- Consumes: mevcut `[data-theme='dark']` token seti.
- Produces: `data-night` özniteliği; ana sayfada kalıcı `onDark`.

- [ ] **Step 1: Token seçicisini genişlet**

`globals.css` içinde `[data-theme='dark'] {` satırını şu hale getir:

```css
[data-theme='dark'],
[data-night] {
```

(`[data-theme='dark'] .text-danger` / `.text-success` kuralları değişmez.)

- [ ] **Step 2: Ana sayfayı sar**

`page.tsx` dönüş bloğunda `<Hero ... />` ile `<ScrollSpyRail ... />` arasındaki tüm içeriği `<div data-night>` içine al. `Script`/JSON-LD etiketleri sarmalayıcının **dışında** kalsın.

- [ ] **Step 3: Header'ı ana sayfada koyu tut**

`Header.tsx` içinde:

```tsx
const onDark = isHome ? !megaOpen : false;
const nightHome = isHome;
```

Header `className` cn bloğunda kaydırılmış durum için:

```tsx
scrolled || megaOpen
  ? nightHome
    ? 'border-b border-white/10 bg-[#0e0e10]/85 backdrop-blur-xl'
    : 'border-b border-border bg-background/95 lg:bg-background/80 lg:backdrop-blur-xl'
  : 'border-b border-transparent bg-transparent'
```

- [ ] **Step 4: Görsel doğrulama**

Run: `npm run dev` (ayrı terminal) ve tarayıcıda `/tr` aç.
Expected: Ana sayfa koyu; header'da marka/menü beyaz; aşağı kaydırınca header koyu yarı saydam kalır; `/tr/urunler` açık temadır.

- [ ] **Step 5: Commit**

```bash
git add bozkir-next/src/app/globals.css "bozkir-next/src/app/[locale]/(site)/page.tsx" bozkir-next/src/components/layout/Header.tsx
git commit -m "feat(home): ana sayfaya kapsanmis karanlik tema ve koyu header"
```

---

### Task 2: Ritim katmanları, bölüm numaraları, Hero sinematik geçişi

**Files:**
- Modify: `bozkir-next/src/app/globals.css` (`@layer components` bloğu)
- Create: `bozkir-next/src/components/ui/ChapterMark.tsx`
- Modify: `bozkir-next/src/components/home/Hero.tsx`
- Test: `bozkir-next/scripts/measure-home.mjs` (Task 8'de kullanılacak)

**Interfaces:**
- Produces: `.pad-scene`, `.pad-band`, `.pad-compact` utility sınıfları; `ChapterMark({ index, total, label })` bileşeni.

- [ ] **Step 1: Boşluk utility'lerini ekle**

`globals.css` `@layer components` içine:

```css
.pad-scene { padding-block: clamp(5rem, 12vw, 10rem); }
.pad-band { padding-block: clamp(4rem, 9vw, 7.5rem); }
.pad-compact { padding-block: clamp(3rem, 6vw, 5rem); }
.chapter-mark {
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent);
}
```

- [ ] **Step 2: `ChapterMark` bileşenini yaz**

```tsx
export function ChapterMark({
  index,
  total,
  label,
}: {
  index: number;
  total: number;
  label: string;
}) {
  return (
    <p className="chapter-mark flex items-center gap-3">
      <span aria-hidden>
        {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <span className="h-px w-8 bg-accent/50" aria-hidden />
      <span>{label}</span>
    </p>
  );
}
```

- [ ] **Step 3: Hero'yu sinematikleştir**

`Hero.tsx` içinde (mevcut GSAP timeline'ı koruyarak):
- H1 sınıfına `text-[clamp(2.6rem,7.2vw,6.5rem)] leading-[0.95] tracking-[-0.02em]` ekle.
- Görselin üstüne `bg-gradient-to-b from-[#0e0e10]/55 via-[#0e0e10]/25 to-[#0e0e10]` perde ekle (mevcut overlay varsa onu bununla değiştir).
- Alt ortaya scroll göstergesi: `<a href="#malzeme">` + aşağı ok ikonu, `aria-label` sözlükten `common.scrollDown` yoksa sabit "Aşağı kaydır" (yeni sözlük anahtarı ekleme).
- Bölüm numarası: sol üstte `<ChapterMark index={1} total={14} label={t('home.story.eyebrow')} />` yerine sabit `01 / 14` + marka etiketi.

- [ ] **Step 4: Görsel doğrulama**

Run: `/tr` sayfasını 1440px ve 390px'te aç.
Expected: H1 masaüstünde ≥ 80px, mobilde ≥ 42px; perde sayesinde metin okunur; scroll göstergesi görünür; parallax çalışır.

- [ ] **Step 5: Commit**

```bash
git add bozkir-next/src/app/globals.css bozkir-next/src/components/ui/ChapterMark.tsx bozkir-next/src/components/home/Hero.tsx
git commit -m "feat(home): sinematik hero, bolum numaralari ve ritim katmanlari"
```

---

### Task 3: Malzeme sahnesi — mobil yatay akış + 3D perdesi

**Files:**
- Modify: `bozkir-next/src/lib/motion.ts` (`STORY_STEP_VH`)
- Modify: `bozkir-next/src/components/home/MaterialStory.tsx`
- Delete: `bozkir-next/src/components/home/Material3D.tsx`

**Interfaces:**
- Consumes: `Panel3D` (`src/components/three/Panel3D.tsx`), `dict.home.material3d` metinleri.
- Produces: `MaterialStory` aynı prop'ları korur (`categories`); `#malzeme` bölümü 3D perdesini kendi içinde barındırır.

- [ ] **Step 1: Adım yüksekliğini düşür**

`src/lib/motion.ts`: `export const STORY_STEP_VH = 65;`

- [ ] **Step 2: Mobilde sticky'yi kapat**

`MaterialStory.tsx`:
- `useGSAP` içinde `const isDesktop = window.matchMedia('(min-width: 1024px)').matches;` — false ise hiç ScrollTrigger kurma.
- Sticky blok: `className="hidden lg:block"` + mevcut `sticky top-0 ...` yapısı yalnız masaüstünde.
- `lg` altı için yatay şerit ekle: `className="lg:hidden -mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2"`; her kategori kartı `w-[78vw] max-w-[320px] snap-start` + görsel `aspect-[4/5]` + başlık + kısa açıklama + kategori linki.
- Mobil şeritte aktif nokta göstergesi: her kartın altında değil, şeridin altında `items.map` ile 6 nokta (dekoratif, `aria-hidden`).

- [ ] **Step 3: 3D perdesini bölüme taşı**

Sticky alanın **altına**, aynı `<section id="malzeme">` içinde:

```tsx
<div className="pad-band border-t border-border">
  <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
    {/* sol: dict.home.material3d.eyebrow / title / body */}
    {/* sağ: <div className="h-[380px] sm:h-[480px] lg:h-[560px] overflow-hidden rounded-2xl border border-border"><Panel3D /></div> */}
  </Container>
</div>
```

`Panel3D` yalnız `lg+`'de render edilsin: `hidden lg:block` sarmalayıcı + mobilde statik görsel/yer tutucu (mevcut `dict.home.material3d.body`).

- [ ] **Step 4: `Material3D.tsx` dosyasını sil**

Run: `Remove-Item src/components/home/Material3D.tsx`
Expected: Başka referans yok (`page.tsx` Task 7'de güncellenecek; geçici olarak typecheck hata verirse Task 7 ile birlikte doğrula).

- [ ] **Step 5: Mobil ölçüm**

Run (dev sunucu açıkken):

```bash
node scripts/measure-home.mjs --width 390 --section malzeme
```

Expected: `#malzeme` yüksekliği < 2600px (önce 4748px).

- [ ] **Step 6: Commit**

```bash
git add bozkir-next/src/lib/motion.ts bozkir-next/src/components/home/MaterialStory.tsx
git rm bozkir-next/src/components/home/Material3D.tsx
git commit -m "feat(home): malzeme sahnesi mobilde yatay akis, 3d perdesi birlesti"
```

---

### Task 4: Ürün teknik rayı (Yön C)

**Files:**
- Create: `bozkir-next/src/lib/product-specs.ts`
- Create: `bozkir-next/src/components/products/ProductSpecRail.tsx`
- Modify: `bozkir-next/src/components/home/FeaturedProducts.tsx`
- Test: `bozkir-next/tests/unit/product-specs.test.ts`

**Interfaces:**
- Produces: `buildSpecRail(product: Product, labels: SpecLabels): SpecItem[]`; `SpecItem = { key: 'surface' | 'thickness' | 'color' | 'code'; label: string; value: string }`; `SpecLabels = { surface: string; thickness: string; color: string; code: string }`.
- `ProductSpecRail({ product, labels, className? })` — `SpecItem[]` boşsa `null`.

- [ ] **Step 1: Başarısız testi yaz**

`tests/unit/product-specs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSpecRail } from '@/lib/product-specs';
import type { Product } from '@/types/product';

const labels = { surface: 'Yüzey', thickness: 'Kalınlık', color: 'Renk', code: 'Kod' };
const base: Product = {
  id: '1', slug: 'a', name: 'A', category: 'Panel', categorySlug: 'panel', images: [],
};

describe('buildSpecRail', () => {
  it('bos alanlari atlar', () => {
    expect(buildSpecRail({ ...base, face: 'Mat' }, labels)).toEqual([
      { key: 'surface', label: 'Yüzey', value: 'Mat' },
    ]);
  });

  it('kalınlık ve renkleri ilk 3 ile sinirlar', () => {
    const items = buildSpecRail(
      { ...base, thicknesses: ['8mm', '10mm', '12mm', '18mm'], colors: ['a', 'b', 'c', 'd'] },
      labels,
    );
    expect(items.find((i) => i.key === 'thickness')?.value).toBe('8 / 10 / 12 mm');
    expect(items.find((i) => i.key === 'color')?.value).toBe('4 renk');
  });

  it('hic veri yoksa bos dizi doner', () => {
    expect(buildSpecRail(base, labels)).toEqual([]);
  });
});
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Run: `npx vitest run tests/unit/product-specs.test.ts`
Expected: FAIL — `Cannot find module '@/lib/product-specs'`

- [ ] **Step 3: `buildSpecRail`'i yaz**

`src/lib/product-specs.ts`:
- `face` varsa `surface`.
- `thicknesses` ilk 3 → `"8 / 10 / 12 mm"` biçiminde (değerler zaten birim içeriyorsa aynen, `mm` yoksa sonuna ` mm`).
- `colors.length > 0` → `"{n} renk"`.
- `code` varsa `code`.
- En fazla 4 öğe; boş olanlar atlanır.

- [ ] **Step 4: Testi yeşile çevir**

Run: `npx vitest run tests/unit/product-specs.test.ts`
Expected: PASS (3 test)

- [ ] **Step 5: Ray bileşenini yaz ve bağla**

`ProductSpecRail`: `dl` + `dt` (etiket, `text-[0.75rem] uppercase tracking-[0.14em] text-muted`) + `dd` (`text-sm text-muted-strong`), `flex flex-wrap gap-x-5 gap-y-2`.

`FeaturedProducts.tsx`: her `Reveal` içinde kartın **altına** `<ProductSpecRail product={product} labels={...} />`; etiketler `dictForRequest`'ten `product.surface`, `product.thickness`, `product.color`, `product.code` anahtarlarıyla (yoksa `dict.catalog` karşılıkları; eksik anahtar eklenmeyecek).

- [ ] **Step 6: Tip kontrolü + commit**

Run: `npm run typecheck`
Expected: 0 hata.

```bash
git add bozkir-next/src/lib/product-specs.ts bozkir-next/src/components/products/ProductSpecRail.tsx bozkir-next/src/components/home/FeaturedProducts.tsx bozkir-next/tests/unit/product-specs.test.ts
git commit -m "feat(home): one cikan urunlerde teknik ray"
```

---

### Task 5: Uygulama & Rehber birleşik bölümü

**Files:**
- Modify: `bozkir-next/src/components/home/ApplicationAreas.tsx` (`bare` prop)
- Modify: `bozkir-next/src/components/home/MaterialGuide.tsx` (`bare` prop)
- Create: `bozkir-next/src/components/home/UsageTabs.tsx` (client)
- Create: `bozkir-next/src/components/home/UsageAndGuide.tsx` (server)

**Interfaces:**
- `ApplicationAreas({ block, locale, bare }: { block: ContentBlock; locale: Locale; bare?: boolean })`
- `MaterialGuide({ block, locale, bare }: { block: ContentBlock; locale: Locale; bare?: boolean })`
- `UsageTabs({ items, children })` — `items: { id: string; label: string }[]`, `children: ReactNode[]`; `role="tablist"`, ok tuşları, `aria-selected`.

- [ ] **Step 1: `bare` prop'larını ekle**

İki bileşende: `bare` true ise `Container` + `SectionHeading` yerine yalnız içerik gövdesi döner (`mt-0`). Bölüm boşsa (`items.length === 0`) yine `null`.

- [ ] **Step 2: Sekme kabuğunu yaz**

`UsageTabs`: `'use client'`; state `active`; `tablist` + `tab` + `tabpanel`; `ArrowLeft/ArrowRight/Home/End` desteği; panel `hidden` yerine yalnız aktif olanı render et (içerik ağırlığı düşsün).

- [ ] **Step 3: Birleşik bölümü yaz**

`UsageAndGuide.tsx` (server): her iki blok da boşsa `null`. `<section id="uygulama" className="pad-band border-y border-border bg-surface/40">` + `<Container>` + `<SectionHeading eyebrow={dict.home.block.applications} title={...}/>` + `<UsageTabs items={[{id:'alanlar',label:dict.home.block.applications},{id:'rehber',label:dict.home.block.guide}]}>` içine `<ApplicationAreas bare …/>` ve `<MaterialGuide bare …/>`.

- [ ] **Step 4: Doğrula**

Run: `npm run typecheck` → 0 hata.
Görsel: sekme değişimi klavye ile çalışır; iki içerik de bir kez render edilir.

- [ ] **Step 5: Commit**

```bash
git add bozkir-next/src/components/home/ApplicationAreas.tsx bozkir-next/src/components/home/MaterialGuide.tsx bozkir-next/src/components/home/UsageTabs.tsx bozkir-next/src/components/home/UsageAndGuide.tsx
git commit -m "feat(home): uygulama ve rehber tek bolumde sekmeli"
```

---

### Task 6: Manifesto & Sayılar + Referans & Markalar

**Files:**
- Modify: `bozkir-next/src/components/home/Manifesto.tsx` (`bare`)
- Modify: `bozkir-next/src/components/home/Testimonials.tsx` (`bare`)
- Modify: `bozkir-next/src/components/home/BrandPartners.tsx` (`bare`)
- Create: `bozkir-next/src/components/home/ManifestoStats.tsx`
- Create: `bozkir-next/src/components/home/SocialProof.tsx`

**Interfaces:**
- `ManifestoStats({ locale, stats }: { locale: Locale; stats?: { value: string; label: string }[] })`
- `SocialProof({ testimonials, brands, locale }: { testimonials?: ContentBlock; brands: Brand[]; locale: Locale })`

- [ ] **Step 1: `bare` prop'ları**

`Manifesto`, `Testimonials`, `BrandPartners`: `bare` true ise dış `Container`/`SectionHeading` atlanır.

- [ ] **Step 2: `ManifestoStats`**

`<section id="manifesto" className="relative overflow-hidden border-y border-border bg-surface">`; içinde `Manifesto bare` + `Container className="pb-16 md:pb-24"` içinde `<StatsBand stats={stats} />`.

- [ ] **Step 3: `SocialProof`**

`<section id="referanslar" className="pad-band">` + tek `SectionHeading` (`testimonials` varsa onun başlığı, yoksa `dict.home.brands.title`); altında `Testimonials bare`; sonra `BrandPartners bare` (marquee). İkisi de boşsa `null`.

- [ ] **Step 4: Doğrula + commit**

Run: `npm run typecheck` → 0 hata.

```bash
git add bozkir-next/src/components/home/Manifesto.tsx bozkir-next/src/components/home/Testimonials.tsx bozkir-next/src/components/home/BrandPartners.tsx bozkir-next/src/components/home/ManifestoStats.tsx bozkir-next/src/components/home/SocialProof.tsx
git commit -m "feat(home): manifesto+sayilar ve referans+markalar birlesti"
```

---

### Task 7: Sayfa kompozisyonu ve bölüm rayı

**Files:**
- Modify: `bozkir-next/src/app/[locale]/(site)/page.tsx`

**Interfaces:**
- Consumes: Task 5 `UsageAndGuide`, Task 6 `ManifestoStats` / `SocialProof`, Task 3 `MaterialStory` (3D dahil).
- Produces: 14 bölümlük nihai sıra.

- [ ] **Step 1: İçe aktarımları güncelle**

Kaldır: `ApplicationAreas`, `MaterialGuide`, `Manifesto`, `StatsBand`, `Testimonials`, `BrandPartners`, `Material3D`.
Ekle: `UsageAndGuide`, `ManifestoStats`, `SocialProof`.

- [ ] **Step 2: Sırayı kur**

```tsx
<Hero image={settings.heroImage || undefined} />
<CampaignSlider campaigns={campaigns} />
<MaterialStory categories={categories} />
<FeaturedProducts locale={lang} />
{gallery && <MaterialGallery block={gallery} locale={lang} />}
<UsageAndGuide areas={applications} guide={guide} locale={lang} />
<ManifestoStats locale={lang} stats={aboutStats.stats} />
{process && <ProcessSteps block={process} locale={lang} />}
<CatalogSection locale={lang} />
<SocialProof testimonials={testimonials} brands={fallbackBrands} locale={lang} />
<SupplyLogistics locale={lang} />
{faq && <FaqAccordion block={faq} locale={lang} />}
<RecentlyViewed />
<QuoteCTA locale={lang} />
<ScrollSpyRail items={railItems} ariaLabel={dict.common.sections} />
```

- [ ] **Step 3: Bölüm rayını güncelle**

`railItems`: `malzeme`, `vitrin`, `uygulama` (`dict.home.block.applications`), `surec`, `sss`. `manifesto` ve `referanslar` ray dışı (kısa bölümler).

- [ ] **Step 4: Tip kontrolü**

Run: `npm run typecheck`
Expected: 0 hata (silinen `Material3D` referansı kalmamalı).

- [ ] **Step 5: Commit**

```bash
git add "bozkir-next/src/app/[locale]/(site)/page.tsx"
git commit -m "feat(home): ana sayfa 14 bolume indirildi"
```

---

### Task 8: Ölçüm, doğrulama, Docker

**Files:**
- Create: `bozkir-next/scripts/measure-home.mjs`

**Interfaces:**
- Produces: `node scripts/measure-home.mjs [--base http://localhost] [--width N]` → JSON: `{ sections, docHeight, viewports, h2, overflow, ids }`.

- [ ] **Step 1: Ölçüm betiğini yaz**

Playwright ile 390/768/1440 genişliklerinde `/tr` açar; `main` altındaki en üst seviye `section`'ları, toplam yüksekliği, yatay taşmayı, H2 sayısını ve bölüm id'lerini JSON basar. `--width` verilirse yalnız o genişlik.

- [ ] **Step 2: Ölç**

Run: `node scripts/measure-home.mjs`
Expected (hedef):

| Genişlik | Bölüm | Yükseklik | Taşma |
|---|---|---|---|
| 390 | 14 | ≤ 15.000px | 0 |
| 768 | 14 | ≤ 14.000px | 0 |
| 1440 | 14 | ≤ 12.000px | 0 |

- [ ] **Step 3: Tip + birim testleri + build**

Run: `npm run typecheck && npm run test`
Expected: 0 hata, tüm testler PASS.

- [ ] **Step 4: Docker imajını yenile**

Run: `docker compose up -d --build`
Expected: `bozkir-next-app-1` healthy.

- [ ] **Step 5: Canlı doğrula**

Run: `node scripts/measure-home.mjs --base http://localhost`
Expected: aynı tablo; `#vitrin`, `#uygulama`, `#manifesto`, `#surec`, `#sss` mevcut; `#koleksiyon` yok; 0 konsol hatası.

- [ ] **Step 6: Commit**

```bash
git add bozkir-next/scripts/measure-home.mjs
git commit -m "test(home): ana sayfa olcum betigi"
git push origin main
```

---

## Notlar

- `ProductCard` zaten renk/kalınlık gösteriyor; teknik ray onu **tekrar etmez**, ürünün altında tek satır özet + teklif bağlantısı verir. `ProductCard` içindeki mevcut chip'ler mobilde görünür kalır (dokunma hedefi), ray `hidden md:block`.
- `CampaignSlider` aktif kampanya yoksa `null` döner; bölüm sayısı 14'ün altına düşebilir — bu beklenen davranış.
- `RecentlyViewed` ziyaretçide geçmiş yoksa `null` döner.

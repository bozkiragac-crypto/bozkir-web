# Ana Sayfa — "Sinematik Vitrin" Tasarım Spec'i

- Tarih: 2026-11-03
- Durum: **Taslak — onay bekliyor**
- Kapsam: `bozkir-next` ana sayfası (`src/app/[locale]/(site)/page.tsx`)
- Yön: A (Sinematik Sahne) + C (Vitrin + Teknik Ray) melezi
- Onaylanan kısıtlar: mevcut görseller yeterli · GSAP kalır · admin düzenlenebilirliği korunur · SEO ve URL yapısı bozulmaz · ana sayfa kullanıcının açık/koyu tema tercihine uyar

---

## 1. Amaç

Ana sayfa bugün 18 içerik bölümü ve ~25 mobil ekran uzunluğunda; bölümlerin çoğu aynı
"eyebrow → H2 → paragraf → grid" şablonunu tekrarladığı için sayfa tepe noktası olmayan
düz bir katalog gibi okunuyor.

Hedef: **bölümleri 14'e indirmek**, tekrarları birleştirmek ve ana sayfayı baştan sona
karanlık, sinematik bir "showroom" olarak yeniden kurmak. İçerik kaybı olmadan.

### Başarı kriterleri

| Metrik | Bugün (ölçüldü) | Hedef |
|---|---|---|
| İçerik bölümü | 18 (+scroll rail) | **14** |
| Mobil sayfa yüksekliği (390px) | 20.887px | **≤ 15.000px** (−%28) |
| Masaüstü yüksekliği (1440px) | 17.085px | **≤ 12.000px** (−%30) |
| `#malzeme` bölümü (mobil) | 4.748px / 5,6 ekran | **≤ 2.200px / 2,6 ekran** |
| Yatay taşma | 0px | 0px |
| CLS | — | < 0,1 |
| Mobil LCP | mevcut ölçüm | **artmamalı** |
| H1 / H2 sayısı | 1 / 11 | 1 / 10–11 (SEO korunur) |
| Konsol hatası | 0 | 0 |

### Kapsam dışı

- Ürün, kategori, iletişim, katalog, hakkımızda sayfalarının görsel dili (açık tema kalır)
- Yeni fotoğraf/video çekimi
- Admin paneli arayüzü (yalnızca mevcut içerik bloklarının okunma biçimi değişir)

---

## 2. Tasarım dili

### 2.1 Tema kapsamı

Ana sayfa, kullanıcının tema tercihine uyar (`<html data-theme="light|dark">`).
`globals.css` içindeki mevcut koyu tema token bloğu tek kaynak olarak kullanılır:

```css
[data-theme='dark'] { ... }
```

Böylece:

- Renk paleti **tek yerden** yönetilir (kopya token yok).
- Açık temada ana sayfa ferah/editoryal, koyu temada sinematik "showroom" görünür.
- Header, hero üzerinde her iki temada da beyaz metin kullanır; sayfa kaydırıldığında
  aktif temanın yüzey/metin renklerine döner.
- Tema tercihi `localStorage` ile kalıcıdır; kayıt yoksa işletim sistemi teması izlenir.

Kullanılan değerler (mevcut koyu tema):

| Token | Değer |
|---|---|
| `--bg` | `#0e0e10` |
| `--surface` / `--surface-2` | `#16161a` / `#1e1e23` |
| `--fg` | `#f2f2f0` |
| `--muted` / `--muted-strong` | `#8f8f98` / `#b4b4bc` |
| `--accent` / `--accent-soft` | `#b3a98f` / `#cfc3a6` |
| `--border` | `rgba(255,255,255,0.11)` |

### 2.2 Tipografi

- Display: mevcut `Fraunces` (`--font-display`) — karanlık zeminde serif kontrastı korur.
- Hero H1: `clamp(2.6rem, 7.2vw, 6.5rem)`, `line-height: 0.95`, `letter-spacing: -0.02em`.
- Bölüm H2: mevcut `.text-section` (Faz 1'de eklenen clamp) korunur.
- Yeni "bölüm numarası" motifi: `01 — 10` biçiminde, `--accent` renginde, `text-xs`
  `tracking-[0.28em]`. Her bölümün sol üstünde tekrar eden sinematik "chapter" işareti.
- Gövde metni: `max-w-[62ch]`, `text-muted-strong`, `leading-relaxed`.

### 2.3 Ritim (en kritik değişiklik)

Bugün her bölüm aynı dikey boşluğu kullanıyor (`py-24 md:py-32`). Yeni ritim üç seviyeli:

| Seviye | Boşluk | Kullanım |
|---|---|---|
| `scene` | `min-h-svh` + `flex items-center` | Hero, Vitrin, Manifesto |
| `band` | `py-[clamp(4rem,9vw,7.5rem)]` | Süreç, Referans, Lojistik |
| `compact` | `py-[clamp(3rem,6vw,5rem)]` | SSS, Son bakılanlar, Katalog |

Böylece sayfa "nefes alan / sıkışan / patlayan" bir tempoya kavuşur; düz şerit olmaktan çıkar.

### 2.4 Hareket (GSAP korunur)

- Mevcut `useGSAP` + `ScrollTrigger` altyapısı kullanılır; yeni ağır bağımlılık yok.
- `prefers-reduced-motion` tüm yeni animasyonlarda da kontrol edilir.
- **Pinning yalnızca `lg+`**: mobilde hiçbir bölüm sabitlenmez (performans + Pil).
- Hero: yavaş Ken Burns (`scale 1 → 1.06`, 8s, `power1.out`) + alt gradyan perde.
- Bölüm girişleri: `opacity + y(24px)` (mevcut `Reveal`), 0,9s `power3.out`.
- Vitrin: yatay kaydırma (`scrub`), mobilde native `scroll-snap`.
- Süreç: `lg+` yatay pin; mobilde dikey zaman çizgisi.

---

## 3. Bölüm haritası: 18 → 14

| # | Yeni bölüm | Kaynak bileşen(ler) | Değişiklik |
|---|---|---|---|
| 1 | Hero | `Hero.tsx` | Karanlık, tam ekran, tek CTA, scroll cue, chapter `01` |
| 2 | Kampanya bandı | `CampaignSlider.tsx` | Yalnızca aktif kampanya varsa; ince karanlık bant |
| 3 | Malzeme sahnesi `#malzeme` | `MaterialStory.tsx` + `Panel3D` | Mobilde sticky kaldırılır → yatay kart akışı; masaüstünde 3 perde |
| 4 | Öne çıkan ürünler `#urunler` | `FeaturedProducts.tsx` + `ProductCard` | **Teknik ray**: yüzey / kalınlık / renk + "Teklif al" |
| 5 | Vitrin `#vitrin` | `MaterialGallery.tsx` + `MaterialShowcase.tsx` | Tam genişlik, karanlık, yatay sinematik akış |
| 6 | Uygulama & Rehber `#uygulama` | `ApplicationAreas` + `MaterialGuide` | **Birleşti**: tek bölüm, iki sekme |
| 7 | Manifesto & Sayılar `#manifesto` | `Manifesto` + `StatsBand` | **Birleşti**: dev alıntı + sayaçlar aynı sahnede |
| 8 | Süreç `#surec` | `ProcessSteps.tsx` | `lg+` yatay pin, mobil dikey zaman çizgisi |
| 9 | Katalog `#katalog` | `CatalogSection.tsx` | Karanlık kapak şeridi, PDF indirme vurgusu |
| 10 | Referans & Markalar `#referanslar` | `Testimonials` + `BrandPartners` | **Birleşti**: alıntılar + logo şeridi |
| 11 | Lojistik `#lojistik` | `SupplyLogistics.tsx` | Kompakt 3 sütun |
| 12 | SSS `#sss` | `FaqAccordion.tsx` | Korunur (FAQPage schema). Karanlık, 5–6 soru |
| 13 | Son bakılanlar `#son-bakilanlar` | `RecentlyViewed.tsx` | Kompakt şerit; boşsa hiç görünmez |
| 14 | Teklif kapanışı `#teklif` | `QuoteCTA.tsx` | Tam ekran kapanış görseli + tek CTA |

**Kaldırılan ayrı bölümler (içerik korunur):**

- `Material3D` → `Panel3D` bileşeni Malzeme sahnesinin son perdesine taşınır; metni Manifesto'ya bağlanır.
- `MaterialGuide` → Uygulama bölümünün 2. sekmesi.
- `StatsBand` → Manifesto sahnesinin alt yarısı.
- `BrandPartners` → Referans bölümünün logo şeridi.

Silinen dosya yok; yalnızca `page.tsx` kompozisyonu değişir. Bileşenler birleşik
bölümlerde alt bileşen olarak yaşamaya devam eder.

---

## 4. Teknik uygulama notları

### 4.1 `page.tsx` kompozisyonu

```tsx
<div data-night>
  <Hero ... />
  <CampaignSlider ... />
  <MaterialStory categories={categories} />
  <FeaturedProducts locale={lang} />
  <MaterialGallery block={gallery} locale={lang} />
  <UsageAndGuide areas={applications} guide={guide} locale={lang} />
  <ManifestoStats quote={...} stats={aboutStats.stats} locale={lang} />
  <ProcessSteps block={process} locale={lang} />
  <CatalogSection locale={lang} />
  <SocialProof testimonials={testimonials} brands={fallbackBrands} locale={lang} />
  <SupplyLogistics locale={lang} />
  <FaqAccordion block={faq} locale={lang} />
  <RecentlyViewed />
  <QuoteCTA locale={lang} />
  <ScrollSpyRail items={railItems} ariaLabel={dict.common.sections} />
</div>
```

`railItems` yeni id'lere göre güncellenir (`uygulama`, `manifesto` eklenir; `malzeme`, `vitrin`, `surec`, `sss` korunur).

### 4.2 Header davranışı

`Header.tsx` zaten `onDark = isHome && !scrolled && !megaOpen` mantığına sahip.
Ana sayfa artık baştan sona karanlık olduğu için:

- `onDark` ana sayfada **her zaman** `true` (kaydırınca da beyaz metin kalır).
- Kaydırılmış durumda header zemini `bg-background` yerine
  `bg-[#0e0e10]/85 backdrop-blur-md` olur (ana sayfaya özel).
- Mega menü açıldığında mevcut açık panel davranışı korunur (okunabilirlik için panel
  `bg-surface` kullanmaya devam eder).

### 4.3 Malzeme sahnesi (mobil kazanımı)

Bugün mobilde de sticky akış kullanılıyor ve `items.length * STORY_STEP_VH` (6 × 90vh)
kadar kaydırma yaratıyor → 4.748px.

- `STORY_STEP_VH` 90 → **65** (masaüstü de hızlanır).
- `lg` altında sticky kaldırılır: kategori kartları yatay `scroll-snap` şeridi olur
  (3 görünür kart, dokunmayla kaydırma, aktif nokta göstergesi).
- Bu tek değişiklik mobilde ~2.500px kazandırır.

### 4.4 Teknik ray (Yön C'nin kalbi)

`FeaturedProducts` kartlarının altında, ürün şemasındaki gerçek alanlardan beslenen
kompakt bir bilgi şeridi:

`face` (yüzey) · `thicknesses` (kalınlık) · `colors` (renk sayısı) · stok durumu · "Teklif al"

- Yeni veri kaynağı yok; `src/types/product.ts` alanları kullanılır.
- `lg+` ürün görseli sticky kalır, ray yanda kayar; mobilde kart altında 2 satır.
- Eksik alan sessizce atlanır (boş etiket gösterilmez).

### 4.5 Performans bütçesi

- Karanlık tema ek görsel yüklemez; aynı 37 görsel `next/image` ile servis edilir.
- Yeni `blur`/`backdrop-filter` yalnızca header'da; mobilde hero perdesi gradyan (filtre yok).
- `lg` altında ScrollTrigger pin sayısı: **0**.
- Ana sayfaya yeni JS kütüphanesi eklenmez.

---

## 5. Erişilebilirlik

- Koyu zeminde kontrast: gövde `#b4b4bc` / `#0e0e10` ≈ 9:1; `--accent` üzerine metin
  yalnızca büyük punto ve `#cfc3a6` ile (≥ 4.5:1 doğrulanacak).
- Odak halkası koyu temada `--accent` ile görünür kalır (`focus-visible` testi).
- Sekmeli bölüm (Uygulama & Rehber): mevcut `ContactMapTabs` deseniyle aynı
  `role="tablist"` / `tab` / `tabpanel` + ok tuşu desteği.
- Hareket: `prefers-reduced-motion` → tüm scrub/pin devre dışı, sadece anlık görünürlük.
- Yatay kaydırmalı şeritlerde klavye ile erişim + `aria-label`.

## 6. SEO

- Her birleşik bölüm **tek** H2 üretir; alt başlıklar H3 (hiyerarşi bozulmaz).
- Korunanlar: `Organization` + `Review` JSON-LD, `FAQPage` (SSS), `ItemList` (Vitrin),
  `localeUrl` tabanlı canonical, tüm mevcut URL'ler.
- Bölüm id'leri: `malzeme`, `vitrin`, `surec`, `sss` **korunur** (dış bağlantılar kırılmaz);
  yeni: `uygulama`, `manifesto`, `katalog`, `referanslar`, `lojistik`, `teklif`.
- `Material3D` kalktığı için kaybolan metin Manifesto'ya taşınır → içerik kaybı yok.

## 7. Admin / veri etkisi

| Blok | Etki |
|---|---|
| `gallery` | Aynı içerik, yeni sunum (Vitrin) |
| `guide` | Uygulama bölümünün 2. sekmesi |
| `applications` | Uygulama bölümünün 1. sekmesi |
| `faq` | Aynı |
| `process` | Aynı |
| `testimonials` | Referans bölümü |
| `aboutStats` | Manifesto sahnesi |

Admin'de hiçbir alan kaldırılmaz veya yeniden adlandırılmaz; yalnızca okunma sırası değişir.

## 8. Riskler ve geri alma

| Risk | Azaltma |
|---|---|
| Karanlık tema ile açık tema arasında geçiş sarsıntısı (ana sayfa → ürün) | Footer karanlık; geçişte `page-fade` korunur; header ana sayfada koyu kalır |
| Mobilde yatay kaydırma keşfedilmez | Görünür kısmi kart (peek) + nokta göstergesi + "kaydır" ipucu |
| Koyu zeminde kontrast düşüşü | AA kontrolü + otomatik kontrast testi (spec sonrası betik) |
| Bölüm birleştirme sonrası içerik erişilemez | Her blok en az bir yerde render edilir; `page.tsx` üzerinden izlenebilir |
| Geri alma | Değişiklikler tek commit; `git revert` ile eski kompozisyona dönülür |

## 9. Ölçüm planı (uygulama sonrası)

1. Playwright ile 390 / 768 / 1440: bölüm sayısı, sayfa yüksekliği, yatay taşma, H2 sayısı.
2. Lighthouse mobil: LCP, CLS, TBT (önce/sonra karşılaştırma).
3. Kontrast taraması: koyu zemindeki tüm metin çiftleri ≥ 4.5:1.
4. Klavye turu: sekmeler, akordeon, yatay şeritler.
5. Docker imajı yeniden derlenir ve `http://localhost` üzerinden doğrulanır.

## 10. Açık sorular

1. Header ana sayfada kaydırınca koyu mu kalsın, yoksa açık zemine mi dönsün? (Öneri: koyu.)
2. `RecentlyViewed` ana sayfada kalsın mı? (Öneri: kalsın — dönen ziyaretçi için değerli, boşsa gizli.)
3. SSS 6 soruya mı indirilsin, yoksa tümü mü kalsın? (Öneri: ilk 6 + "tümü" bağlantısı.)

import type { Dictionary } from './dictionaries';
import type { Locale } from './config';

export interface TextFieldDef {
  path: string;
  label: string;
  multiline?: boolean;
  maxLength?: number;
}

export interface TextGroupDef {
  id: string;
  title: string;
  hint?: string;
  fields: TextFieldDef[];
}

/**
 * Admin'den düzenlenebilen metin anahtarları.
 *
 * Bilinçli olarak yalnızca içerik/marka/SEO metinleri burada tutulur. Buton,
 * form, hata, filtre, 404/bakım gibi arayüz etiketleri sözlük varsayılanından
 * gelir; böylece yanlış metinle site işlevinin bozulması ve saldırı yüzeyi
 * azaltılır. Yeni alan eklerken yalnızca buraya kaydetmek yeterlidir.
 */
export const TEXT_GROUPS: TextGroupDef[] = [
  {
    id: 'identity',
    title: 'Marka & Navigasyon',
    hint: 'Site adı, slogan, ana menü etiketleri ve footer imzası.',
    fields: [
      { path: 'meta.brand', label: 'Marka adı', maxLength: 120 },
      { path: 'meta.brandTagline', label: 'Marka sloganı', maxLength: 160 },
      { path: 'nav.products', label: 'Nav: Ürünler', maxLength: 40 },
      { path: 'nav.collections', label: 'Nav: Koleksiyonlar', maxLength: 40 },
      { path: 'nav.catalogs', label: 'Nav: Kataloglar', maxLength: 40 },
      { path: 'nav.about', label: 'Nav: Hakkımızda', maxLength: 40 },
      { path: 'nav.contact', label: 'Nav: İletişim', maxLength: 40 },
      { path: 'nav.quote', label: 'Nav: Teklif Al', maxLength: 40 },
      { path: 'nav.faq', label: 'Nav: SSS', maxLength: 40 },
      { path: 'nav.featuredProducts', label: 'Nav: Öne çıkanlar', maxLength: 60 },
      { path: 'footer.tagline', label: 'Footer açıklaması', multiline: true, maxLength: 240 },
      { path: 'footer.madeIn', label: 'Footer alt marka metni', maxLength: 120 },
    ],
  },
  {
    id: 'home-hero',
    title: 'Ana Sayfa — Hero',
    fields: [
      { path: 'home.hero.eyebrow', label: 'Üst etiket', maxLength: 80 },
      { path: 'home.hero.titleLead', label: 'Başlık (düz)', maxLength: 120 },
      { path: 'home.hero.titleAccent', label: 'Başlık (vurgu)', maxLength: 120 },
      { path: 'home.hero.intro', label: 'Açıklama', multiline: true, maxLength: 320 },
      { path: 'home.hero.ctaProducts', label: 'Buton: Ürünler', maxLength: 40 },
      { path: 'home.hero.ctaQuote', label: 'Buton: Teklif', maxLength: 40 },
      { path: 'home.hero.scroll', label: 'Kaydırma metni', maxLength: 60 },
    ],
  },
  {
    id: 'home-sections',
    title: 'Ana Sayfa — Bölüm Metinleri',
    fields: [
      { path: 'home.manifesto.eyebrow', label: 'Manifesto üst etiket', maxLength: 60 },
      {
        path: 'home.manifesto.quote',
        label: 'Manifesto alıntısı',
        multiline: true,
        maxLength: 320,
      },
      { path: 'home.manifesto.signature', label: 'Manifesto imzası', maxLength: 160 },
      { path: 'home.story.eyebrow', label: 'Keşfet: üst etiket', maxLength: 60 },
      { path: 'home.story.title', label: 'Keşfet: başlık', maxLength: 160 },
      { path: 'home.story.collectionCta', label: 'Keşfet: buton', maxLength: 60 },
      { path: 'home.showcase.eyebrow', label: 'Koleksiyon: üst etiket', maxLength: 60 },
      { path: 'home.showcase.title', label: 'Koleksiyon: başlık', maxLength: 120 },
      { path: 'home.showcase.catalogCta', label: 'Koleksiyon: buton', maxLength: 60 },
      { path: 'home.featuredProducts.eyebrow', label: 'Öne çıkanlar: üst etiket', maxLength: 60 },
      { path: 'home.featuredProducts.title', label: 'Öne çıkanlar: başlık', maxLength: 120 },
      {
        path: 'home.featuredProducts.body',
        label: 'Öne çıkanlar: açıklama',
        multiline: true,
        maxLength: 220,
      },
      { path: 'home.featuredProducts.cta', label: 'Öne çıkanlar: buton', maxLength: 60 },
      { path: 'home.material3d.eyebrow', label: 'Panel kesiti: üst etiket', maxLength: 60 },
      { path: 'home.material3d.title', label: 'Panel kesiti: başlık', maxLength: 160 },
      {
        path: 'home.material3d.body',
        label: 'Panel kesiti: açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'home.material3d.hint', label: 'Panel kesiti: ipucu', maxLength: 120 },
      { path: 'home.supply.eyebrow', label: 'Tedarik: üst etiket', maxLength: 60 },
      { path: 'home.supply.title', label: 'Tedarik: başlık', maxLength: 160 },
      { path: 'home.supply.cta', label: 'Tedarik: buton', maxLength: 60 },
      { path: 'home.quoteCta.title', label: 'Teklif CTA: başlık', maxLength: 160 },
      {
        path: 'home.quoteCta.body',
        label: 'Teklif CTA: açıklama',
        multiline: true,
        maxLength: 240,
      },
      { path: 'home.quoteCta.cta', label: 'Teklif CTA: buton', maxLength: 60 },
      { path: 'home.quoteCta.whatsapp', label: 'Teklif CTA: WhatsApp metni', maxLength: 60 },
    ],
  },
  {
    id: 'pages',
    title: 'Sayfa Başlıkları',
    fields: [
      { path: 'pages.about.heroEyebrow', label: 'Hakkımızda: üst etiket', maxLength: 60 },
      { path: 'pages.about.heroTitle', label: 'Hakkımızda: başlık', maxLength: 160 },
      {
        path: 'pages.about.heroDescription',
        label: 'Hakkımızda: açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.contact.heroEyebrow', label: 'İletişim: üst etiket', maxLength: 60 },
      { path: 'pages.contact.heroTitle', label: 'İletişim: başlık', maxLength: 160 },
      {
        path: 'pages.contact.heroDescription',
        label: 'İletişim: açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.catalog.heroEyebrow', label: 'Katalog: üst etiket', maxLength: 60 },
      { path: 'pages.catalog.heroTitle', label: 'Katalog: başlık', maxLength: 160 },
      {
        path: 'pages.catalog.heroDescription',
        label: 'Katalog: açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.dealers.heroEyebrow', label: 'Bayilikler: üst etiket', maxLength: 60 },
      { path: 'pages.dealers.heroTitle', label: 'Bayilikler: başlık', maxLength: 160 },
      {
        path: 'pages.dealers.heroDescription',
        label: 'Bayilikler: açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'categories.title', label: 'Koleksiyonlar: başlık', maxLength: 160 },
      {
        path: 'categories.description',
        label: 'Koleksiyonlar: açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'quote.title', label: 'Teklif: üst etiket', maxLength: 60 },
      { path: 'quote.heading', label: 'Teklif: başlık', maxLength: 160 },
      { path: 'quote.description', label: 'Teklif: açıklama', multiline: true, maxLength: 320 },
    ],
  },
  {
    id: 'legal',
    title: 'Yasal Sayfalar',
    hint: 'Yasal sayfa başlıkları ve ortak uyarı metni. Gövde metinleri Ayarlar → Yasal metinler bölümünden düzenlenir.',
    fields: [
      { path: 'pages.legal.eyebrow', label: 'Yasal: üst etiket', maxLength: 60 },
      { path: 'pages.legal.updated', label: 'Yasal: güncelleme etiketi', maxLength: 60 },
      {
        path: 'pages.legal.disclaimer',
        label: 'Yasal: uyarı metni',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.kvkk.title', label: 'KVKK: başlık', maxLength: 160 },
      { path: 'pages.privacy.title', label: 'Gizlilik: başlık', maxLength: 160 },
      { path: 'pages.cookies.title', label: 'Çerez: başlık', maxLength: 160 },
    ],
  },
  {
    id: 'seo',
    title: 'Sayfa SEO',
    hint: 'Ana sayfaların meta başlık/açıklamaları. Boşsa sözlük varsayılanı kullanılır.',
    fields: [
      { path: 'meta.home', label: 'Ana sayfa: SEO başlık', maxLength: 160 },
      {
        path: 'meta.homeDescription',
        label: 'Ana sayfa: SEO açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'categories.metaTitle', label: 'Koleksiyonlar: SEO başlık', maxLength: 160 },
      {
        path: 'categories.metaDescription',
        label: 'Koleksiyonlar: SEO açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'productsPage.metaTitle', label: 'Ürünler: SEO başlık', maxLength: 160 },
      {
        path: 'productsPage.metaDescription',
        label: 'Ürünler: SEO açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.about.metaTitle', label: 'Hakkımızda: SEO başlık', maxLength: 160 },
      {
        path: 'pages.about.metaDescription',
        label: 'Hakkımızda: SEO açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.contact.metaTitle', label: 'İletişim: SEO başlık', maxLength: 160 },
      {
        path: 'pages.contact.metaDescription',
        label: 'İletişim: SEO açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.catalog.metaTitle', label: 'Katalog: SEO başlık', maxLength: 160 },
      {
        path: 'pages.catalog.metaDescription',
        label: 'Katalog: SEO açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'pages.dealers.metaTitle', label: 'Bayilikler: SEO başlık', maxLength: 160 },
      {
        path: 'pages.dealers.metaDescription',
        label: 'Bayilikler: SEO açıklama',
        multiline: true,
        maxLength: 320,
      },
      { path: 'home.block.faq', label: 'SSS: SEO açıklama', multiline: true, maxLength: 320 },
    ],
  },
];

export const TEXT_FIELD_BY_PATH = new Map(
  TEXT_GROUPS.flatMap((group) => group.fields.map((field) => [field.path, field] as const)),
);

export const TEXT_PATHS = new Set(TEXT_FIELD_BY_PATH.keys());

export type SiteTexts = Partial<Record<Locale, Record<string, string>>>;

/** Kayıt ve okuma anında aynı temizliği uygular. */
export function cleanTextValue(path: string, raw: unknown): string {
  const field = TEXT_FIELD_BY_PATH.get(path);
  if (!field) return '';
  let value = String(raw ?? '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .trim();
  if (!field.multiline) value = value.replace(/\s+/g, ' ');
  return value.slice(0, field.maxLength ?? 320);
}

function partsOf(path: string): string[] {
  return path.replace(/\[(\d+)\]/g, '.$1').split('.');
}

export function getTextByPath(source: unknown, path: string): string {
  let current: unknown = source;
  for (const part of partsOf(path)) {
    if (!current || typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : '';
}

function setTextByPath(target: unknown, path: string, value: string): void {
  const parts = partsOf(path);
  let current = target as Record<string, unknown> | unknown[] | undefined;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current || typeof current !== 'object') return;
    current = (current as Record<string, unknown>)[parts[i]!] as
      | Record<string, unknown>
      | unknown[];
  }
  if (current && typeof current === 'object') {
    (current as Record<string, unknown>)[parts[parts.length - 1]!] = value;
  }
}

/** Sözlüğü değiştirmeden, admin override'larını uygulanmış bir kopya döndürür. */
export function applyTextOverrides(
  dictionary: Dictionary,
  locale: Locale,
  texts?: SiteTexts,
): Dictionary {
  const overrides = texts?.[locale];
  if (!overrides || Object.keys(overrides).length === 0) return dictionary;

  const clone = structuredClone(dictionary);
  for (const [path, raw] of Object.entries(overrides)) {
    if (!TEXT_PATHS.has(path)) continue;
    const value = cleanTextValue(path, raw);
    if (value) setTextByPath(clone, path, value);
  }
  return clone;
}

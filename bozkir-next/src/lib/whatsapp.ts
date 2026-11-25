import type { Locale } from '@/i18n/config';
import type { AvailabilityStatus, Product } from '@/types/product';

export type WhatsAppTemplateSet = Record<Locale, string>;
export type WhatsAppIntent = 'general' | 'product' | 'sample' | 'quote' | 'share';

export const WHATSAPP_INTENTS: WhatsAppIntent[] = [
  'general',
  'product',
  'sample',
  'quote',
  'share',
];

/** Tek bir WhatsApp mesajının admin tarafından girilebilecek azami uzunluğu. */
export const WHATSAPP_TEMPLATE_MAX_LENGTH = 1000;

export interface WhatsAppMessageSettings {
  general: WhatsAppTemplateSet;
  product: WhatsAppTemplateSet;
  /** Eski kayıtlarda bulunmayabilir; okuma sırasında varsayılanla birleştirilir. */
  sample?: WhatsAppTemplateSet;
  quote?: WhatsAppTemplateSet;
  share?: WhatsAppTemplateSet;
}

export type NormalizedWhatsAppMessages = Required<WhatsAppMessageSettings>;

/**
 * Bağlama göre seçilen varsayılan mesajlar. Admin panelinden değiştirilebilir;
 * ürün bazlı mesaj boşsa ürün şablonu, o da boşsa genel şablon kullanılır.
 */
export const DEFAULT_WHATSAPP_MESSAGES: NormalizedWhatsAppMessages = {
  general: {
    tr: 'Merhaba, ürünleriniz hakkında bilgi ve fiyat teklifi almak istiyorum. Yardımcı olabilir misiniz?',
    en: 'Hello, I would like information and a price quote about your products. Could you help me?',
    ar: 'مرحباً، أرغب في الحصول على معلومات وعرض سعر بشأن منتجاتكم. هل يمكنكم مساعدتي؟',
  },
  product: {
    tr: 'Merhaba, {product} ({code}) ürününüz için fiyat ve stok bilgisi alabilir miyim? {surface} {thickness} {dimensions} {availability} {url}',
    en: 'Hello, could I get price and stock information for {product} ({code})? {surface} {thickness} {dimensions} {availability} {url}',
    ar: 'مرحباً، هل يمكنني الحصول على معلومات السعر والمخزون لمنتج {product} ({code})؟ {surface} {thickness} {dimensions} {availability} {url}',
  },
  sample: {
    tr: 'Merhaba, {product} ({code}) ürünü için numune talep etmek istiyorum. Gönderebilir misiniz? {url}',
    en: 'Hello, I would like to request a sample of {product} ({code}). Could you send it? {url}',
    ar: 'مرحباً، أرغب في طلب عينة من منتج {product} ({code}). هل يمكنكم إرسالها؟ {url}',
  },
  quote: {
    tr: 'Merhaba, teklif talebimi WhatsApp üzerinden de iletmek istiyorum: {products} {summary} {page}',
    en: 'Hello, I would like to send my quote request via WhatsApp too: {products} {summary} {page}',
    ar: 'مرحباً، أود إرسال طلب عرض السعر عبر واتساب أيضاً: {products} {summary} {page}',
  },
  share: {
    tr: 'Merhaba, bu ürünü incelemenizi öneririm: {product} ({code}) {url}',
    en: 'Hello, I recommend you take a look at this product: {product} ({code}) {url}',
    ar: 'مرحباً، أنصحك بالاطلاع على هذا المنتج: {product} ({code}) {url}',
  },
};

/**
 * Önceki sürümde varsayılan olan metinler. Admin bunları değiştirmediyse yeni
 * akıllı şablonların görünmesi için otomatik olarak güncellenir.
 */
const LEGACY_WHATSAPP_BRAND_TEXTS = ['Bozkır Ağaç Ürünleri', 'Bozkır Wood Products', 'بوزكير'];

const LEGACY_WHATSAPP_MESSAGES: Partial<
  Record<WhatsAppIntent, Partial<Record<Locale, string[]>>>
> = {
  general: {
    tr: [
      'Merhaba, ürünleriniz hakkında bilgi ve fiyat teklifi almak istiyorum. Yardımcı olabilir misiniz?',
    ],
    en: [
      'Hello, I would like information and a price quote about your products. Could you help me?',
    ],
    ar: ['مرحباً، أرغب في الحصول على معلومات وعرض سعر بشأن منتجاتكم. هل يمكنكم مساعدتي؟'],
  },
  product: {
    // Veritabanında görülen eski yazımlar: ürünü / ürününüz / ürünüz.
    tr: [
      'Merhaba, {product} ({code}) ürünü hakkında bilgi ve fiyat teklifi almak istiyorum. {url}',
      'Merhaba, {product} ({code}) ürününüz hakkında bilgi ve fiyat teklifi almak istiyorum. {url}',
      'Merhaba, {product} ({code}) ürünüz hakkında bilgi ve fiyat teklifi almak istiyorum. {url}',
    ],
    en: ['Hello, I would like information and a price quote about {product} ({code}). {url}'],
    ar: ['مرحباً، أرغب في الحصول على معلومات وعرض سعر بشأن منتج {product} ({code}). {url}'],
  },
};

/** Eski varsayılan (veya eski marka adlı) bir şablon mu? */
export function isLegacyWhatsAppTemplate(
  intent: WhatsAppIntent,
  locale: Locale,
  text: string,
): boolean {
  const value = text.trim();
  if (!value) return false;
  if (LEGACY_WHATSAPP_BRAND_TEXTS.some((brand) => value.includes(brand))) return true;
  return LEGACY_WHATSAPP_MESSAGES[intent]?.[locale]?.includes(value) ?? false;
}

const AVAILABILITY_LABELS: Record<Locale, Record<AvailabilityStatus, string>> = {
  tr: {
    in_stock: 'Stokta',
    on_order: 'Sipariş üzerine',
    check_availability: 'Stok sorunuz',
  },
  en: {
    in_stock: 'In stock',
    on_order: 'On order',
    check_availability: 'Check availability',
  },
  ar: {
    in_stock: 'متوفر',
    on_order: 'حسب الطلب',
    check_availability: 'استفسر عن التوفر',
  },
};

const QUOTE_SUMMARY_LABELS: Record<
  Locale,
  { fullName: string; company: string; quantity: string; dimensions: string; note: string; page: string }
> = {
  tr: {
    fullName: 'Ad Soyad',
    company: 'Firma',
    quantity: 'Adet',
    dimensions: 'Ölçü',
    note: 'Not',
    page: 'Sayfa',
  },
  en: {
    fullName: 'Name',
    company: 'Company',
    quantity: 'Quantity',
    dimensions: 'Dimensions',
    note: 'Note',
    page: 'Page',
  },
  ar: {
    fullName: 'الاسم',
    company: 'الشركة',
    quantity: 'الكمية',
    dimensions: 'المقاسات',
    note: 'ملاحظة',
    page: 'الصفحة',
  },
};

/** `{product}`, `{code}`, `{surface}`, `{url}` gibi yer tutucuları doldurur. */
export function fillTemplate(
  template: string,
  vars: Record<string, string | null | undefined>,
): string {
  return template
    .replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** wa.me / telefon / tam URL değerlerini kabul eder. */
export function normalizeWhatsAppBase(raw: string, fallbackPhone = ''): string {
  const value = raw.trim();
  if (!value) {
    const digits = fallbackPhone.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '';
  }
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(?:www\.)?wa\.me\//i.test(value)) return `https://${value}`;
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

/** WhatsApp bağlantısına metni ekler (mevcut `text` parametresini ezer). */
export function whatsappHref(raw: string, message: string, fallbackPhone = ''): string {
  const base = normalizeWhatsAppBase(raw, fallbackPhone);
  if (!base) return '';
  try {
    const url = new URL(base);
    url.searchParams.set('text', message);
    return url.toString();
  } catch {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}text=${encodeURIComponent(message)}`;
  }
}

/**
 * Admin formundan gelen şablonları normalize eder. Yeni intent alanları eski
 * kayıtlarda olmadığı için eksik olanlar `current` (varsayılan) değerini alır.
 */
export function normalizeWhatsAppMessages(
  input: WhatsAppMessageSettings | undefined,
  current: WhatsAppMessageSettings = DEFAULT_WHATSAPP_MESSAGES,
): NormalizedWhatsAppMessages {
  const out = {} as NormalizedWhatsAppMessages;
  for (const intent of WHATSAPP_INTENTS) {
    const base = current[intent] ?? DEFAULT_WHATSAPP_MESSAGES[intent];
    const saved = input?.[intent];
    out[intent] = {
      tr: (saved?.tr ?? '').trim().slice(0, WHATSAPP_TEMPLATE_MAX_LENGTH) || base.tr,
      en: (saved?.en ?? '').trim().slice(0, WHATSAPP_TEMPLATE_MAX_LENGTH) || base.en,
      ar: (saved?.ar ?? '').trim().slice(0, WHATSAPP_TEMPLATE_MAX_LENGTH) || base.ar,
    };
  }
  return out;
}

/**
 * Dil şablonunu çözer. Intent için kayıtlı metin yoksa (eski ayarlar) genel
 * şablona, o da yoksa kod içindeki varsayılana düşer.
 */
export function resolveWhatsAppTemplate(
  messages: WhatsAppMessageSettings | undefined,
  locale: Locale,
  intent: WhatsAppIntent = 'general',
): string {
  const saved = messages?.[intent];
  const localized = saved?.[locale]?.trim();
  if (localized) return localized;
  const turkish = saved?.tr?.trim();
  if (turkish) return turkish;

  const general = messages?.general;
  const generalLocalized = general?.[locale]?.trim();
  if (generalLocalized) return generalLocalized;
  const generalTurkish = general?.tr?.trim();
  if (generalTurkish) return generalTurkish;

  const fallback = DEFAULT_WHATSAPP_MESSAGES[intent] ?? DEFAULT_WHATSAPP_MESSAGES.general;
  return fallback[locale] || fallback.tr;
}

type ProductMessageProduct = Pick<
  Product,
  | 'name'
  | 'code'
  | 'category'
  | 'slug'
  | 'whatsappMessage'
  | 'face'
  | 'thicknesses'
  | 'dimensions'
  | 'availabilityStatus'
>;

export interface ProductMessageOptions {
  /** Varsayılan `product`; numune ve paylaşım şablonları da ürün bağlamı kullanır. */
  intent?: Extract<WhatsAppIntent, 'product' | 'sample' | 'share'>;
  /** Ürün bazlı özel mesaj yerine intent şablonunu kullan (numune/paylaşım). */
  useCustomMessage?: boolean;
  /** Temin durumunun dil karşılığı; verilmezse yerleşik TR/EN/AR etiketi. */
  availabilityLabel?: (status: AvailabilityStatus) => string;
  /** `locale` parametresi verilmezse kullanılacak dil (çağrı tarafı kolaylığı). */
  locale?: Locale;
}

/** Ürün bağlamından (ad/kod/yüzey/ölçü/stok/link) mesaj üretir. */
export function buildProductWhatsAppMessage(
  product: ProductMessageProduct,
  messages: WhatsAppMessageSettings | undefined,
  locale: Locale,
  url: string,
  options: ProductMessageOptions = {},
): string {
  const effectiveLocale = options.locale ?? locale;
  const intent = options.intent ?? 'product';
  const custom = options.useCustomMessage === false ? '' : product.whatsappMessage?.trim();
  const template = custom || resolveWhatsAppTemplate(messages, effectiveLocale, intent);
  const label =
    options.availabilityLabel ??
    ((status: AvailabilityStatus) =>
      AVAILABILITY_LABELS[effectiveLocale]?.[status] ?? AVAILABILITY_LABELS.tr[status]);

  return fillTemplate(template, {
    product: product.name,
    code: product.code ?? '',
    category: product.category,
    slug: product.slug,
    url,
    page: url,
    surface: product.face ?? '',
    thickness: product.thicknesses?.join(' · ') ?? '',
    dimensions: product.dimensions ?? '',
    availability: product.availabilityStatus ? label(product.availabilityStatus) : '',
    locale: effectiveLocale,
  });
}

export interface QuoteMessageContext {
  /** "Ürün (Kod)" biçiminde hazırlanmış seçili ürün etiketleri. */
  products?: string[];
  fullName?: string;
  company?: string;
  quantity?: string;
  dimensions?: string;
  note?: string;
  page?: string;
  locale?: Locale;
}

/** Teklif formu bağlamından (ürünler/ad/adet/ölçü/not) mesaj üretir. */
export function buildQuoteWhatsAppMessage(
  messages: WhatsAppMessageSettings | undefined,
  locale: Locale,
  context: QuoteMessageContext = {},
): string {
  const effectiveLocale = context.locale ?? locale;
  const labels = QUOTE_SUMMARY_LABELS[effectiveLocale] ?? QUOTE_SUMMARY_LABELS.tr;
  const summary = [
    context.fullName?.trim() && `${labels.fullName}: ${context.fullName.trim()}`,
    context.company?.trim() && `${labels.company}: ${context.company.trim()}`,
    context.quantity?.trim() && `${labels.quantity}: ${context.quantity.trim()}`,
    context.dimensions?.trim() && `${labels.dimensions}: ${context.dimensions.trim()}`,
    context.note?.trim() && `${labels.note}: ${context.note.trim().slice(0, 300)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return fillTemplate(resolveWhatsAppTemplate(messages, effectiveLocale, 'quote'), {
    products: (context.products ?? []).filter(Boolean).join(', '),
    summary,
    page: context.page?.trim() ? `${labels.page}: ${context.page.trim()}` : '',
    fullName: context.fullName ?? '',
    company: context.company ?? '',
    quantity: context.quantity ?? '',
    dimensions: context.dimensions ?? '',
    note: context.note ?? '',
    locale: effectiveLocale,
  });
}

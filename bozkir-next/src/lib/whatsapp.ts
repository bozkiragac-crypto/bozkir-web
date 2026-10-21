import type { Locale } from '@/i18n/config';
import type { Product } from '@/types/product';

export type WhatsAppTemplateSet = Record<Locale, string>;

export interface WhatsAppMessageSettings {
  general: WhatsAppTemplateSet;
  product: WhatsAppTemplateSet;
}

/**
 * Varsayılan mesajlar. Admin panelinden değiştirilebilir; ürün bazlı mesaj
 * boşsa ürün şablonu, o da boşsa genel şablon kullanılır.
 */
export const DEFAULT_WHATSAPP_MESSAGES: WhatsAppMessageSettings = {
  general: {
    tr: 'Merhaba, Bozkır Ağaç Ürünleri hakkında bilgi ve fiyat teklifi almak istiyorum. Yardımcı olabilir misiniz?',
    en: 'Hello, I would like information and a price quote for Bozkır Wood Products. Could you help me?',
    ar: 'مرحباً، أود الحصول على معلومات وعرض سعر لمنتجات بوزكير الخشبية. هل يمكنكم مساعدتي؟',
  },
  product: {
    tr: 'Merhaba, {product} ({code}) ürünü hakkında bilgi ve fiyat teklifi almak istiyorum. {url}',
    en: 'Hello, I would like information and a price quote for {product} ({code}). {url}',
    ar: 'مرحباً، أود الحصول على معلومات وعرض سعر لمنتج {product} ({code}). {url}',
  },
};

/** `{product}`, `{code}`, `{category}`, `{url}` gibi yer tutucuları doldurur. */
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

export function resolveWhatsAppTemplate(
  messages: WhatsAppMessageSettings | undefined,
  locale: Locale,
  kind: 'general' | 'product',
): string {
  const fallback = DEFAULT_WHATSAPP_MESSAGES[kind];
  const localized = messages?.[kind]?.[locale]?.trim();
  if (localized) return localized;
  const turkish = messages?.[kind]?.tr?.trim();
  if (turkish) return turkish;
  return fallback[locale] || fallback.tr;
}

export function buildProductWhatsAppMessage(
  product: Pick<Product, 'name' | 'code' | 'category' | 'slug' | 'whatsappMessage'>,
  messages: WhatsAppMessageSettings | undefined,
  locale: Locale,
  url: string,
): string {
  const template =
    product.whatsappMessage?.trim() || resolveWhatsAppTemplate(messages, locale, 'product');
  return fillTemplate(template, {
    product: product.name,
    code: product.code ?? '',
    category: product.category,
    slug: product.slug,
    url,
  });
}

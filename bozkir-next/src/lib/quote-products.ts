/**
 * Teklif formuna taşınabilecek ürün sayısı.
 * URL uzunluğu ve API alan sınırlarıyla uyumlu tutulur; `favoriler` sayfası
 * bu sayıyı aşarsa kullanıcıya bilgi verilir.
 */
export const MAX_QUOTE_PRODUCTS = 12;

const MAX_SLUG_LENGTH = 160;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Ürün slug'ı URL-güvenli mi? (`slugify` çıktısıyla aynı alfabe.) */
export function isValidProductSlug(value: string): boolean {
  return value.length > 0 && value.length <= MAX_SLUG_LENGTH && SLUG_RE.test(value);
}

/**
 * `?urun=` (tek ürün) ve `?urunler=` (çoklu) parametrelerini tekilleştirir,
 * geçersiz slug'ları atar ve üst sınırı uygular.
 */
export function parseQuoteSlugs(values: (string | string[] | undefined)[]): {
  slugs: string[];
  truncated: boolean;
} {
  const raw = values.flatMap((value) =>
    Array.isArray(value)
      ? value.flatMap((item) => item.split(','))
      : typeof value === 'string'
        ? value.split(',')
        : [],
  );
  const unique = [...new Set(raw.map((slug) => slug.trim()).filter(Boolean))];
  const valid = unique.filter(isValidProductSlug);
  return {
    slugs: valid.slice(0, MAX_QUOTE_PRODUCTS),
    truncated: valid.length > MAX_QUOTE_PRODUCTS,
  };
}

import { toAscii } from '@/lib/data/category-key';

/**
 * Teklif formundaki aranabilir ürün seçicisinin saf yardımcıları.
 *
 * Arama; ürün adı, kodu ve kategori üzerinde çalışır. Türkçe karakterler
 * ASCII'ye indirgenir (ı/i, ş/s, ğ/g...), böylece "kayin" yazınca "Kayın"
 * bulunur. Arapça gibi ASCII dışı alfabe korunur.
 */

export interface PickableProduct {
  id: string;
  slug: string;
  name: string;
  code?: string;
  category?: string;
  image?: string;
}

/** Arama için normal biçim: küçük harf, aksan/noktalama temizliği. */
export function normalizePickerQuery(value: string): string {
  return toAscii(String(value ?? ''))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Ürünleri sorguya göre filtreler; seçilmiş ürünleri çıkarır ve sonucu
 * `limit` ile sınırlar. Sorgu boşsa ilk ürünler öneri olarak döner.
 */
export function filterQuoteProducts(
  products: PickableProduct[],
  query: string,
  selectedSlugs: string[] = [],
  limit = 8,
): PickableProduct[] {
  const selected = new Set(selectedSlugs);
  const tokens = normalizePickerQuery(query).split(' ').filter(Boolean);
  const max = Math.max(1, limit);

  return products
    .filter((product) => !selected.has(product.slug))
    .filter((product) => {
      if (tokens.length === 0) return true;
      const haystack = normalizePickerQuery(
        `${product.name} ${product.code ?? ''} ${product.category ?? ''}`,
      );
      return tokens.every((token) => haystack.includes(token));
    })
    .slice(0, max);
}

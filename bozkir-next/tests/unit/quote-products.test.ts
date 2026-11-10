import { describe, expect, it } from 'vitest';
import {
  isValidProductSlug,
  MAX_QUOTE_PRODUCTS,
  parseQuoteSlugs,
} from '@/lib/quote-products';

describe('quote-products', () => {
  it('tek ve çoklu parametreleri birleştirir, tekrarları atar', () => {
    expect(parseQuoteSlugs(['a-1', 'b-2,c-3', 'a-1'])).toEqual({
      slugs: ['a-1', 'b-2', 'c-3'],
      truncated: false,
    });
  });

  it('tekrarlanan query parametrelerini (dizi) de çözer', () => {
    expect(parseQuoteSlugs([['a-1', 'b-2'], 'c-3,a-1'])).toEqual({
      slugs: ['a-1', 'b-2', 'c-3'],
      truncated: false,
    });
  });

  it('geçersiz ve boş slug değerlerini atar', () => {
    expect(
      parseQuoteSlugs(['', 'Ürün', 'gecerli-1', 'x'.repeat(161), '../etc', 'a b']),
    ).toEqual({ slugs: ['gecerli-1'], truncated: false });
  });

  it('üst sınırı uygular ve truncated bilgisini döner', () => {
    const input = Array.from({ length: MAX_QUOTE_PRODUCTS + 2 }, (_, i) => `urun-${i}`).join(',');
    const { slugs, truncated } = parseQuoteSlugs([input]);
    expect(slugs).toHaveLength(MAX_QUOTE_PRODUCTS);
    expect(truncated).toBe(true);
  });

  it('isValidProductSlug sınırlarını uygular', () => {
    expect(isValidProductSlug('mdf-lam-123')).toBe(true);
    expect(isValidProductSlug('MDF')).toBe(false);
    expect(isValidProductSlug('-abc')).toBe(false);
    expect(isValidProductSlug('abc-')).toBe(false);
    expect(isValidProductSlug('')).toBe(false);
    expect(isValidProductSlug('a'.repeat(161))).toBe(false);
  });
});

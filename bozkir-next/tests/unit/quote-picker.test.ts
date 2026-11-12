import { describe, it, expect } from 'vitest';
import {
  filterQuoteProducts,
  normalizePickerQuery,
  type PickableProduct,
} from '@/lib/quote-picker';

const products: PickableProduct[] = [
  { id: '1', slug: 'hezaren-mdflam', name: 'Hezaren', code: 'YT-40C', category: 'MDF Lam' },
  { id: '2', slug: 'kayin-kaplamali', name: 'Kayın', code: 'KPL-1', category: 'Kaplamalı MDF' },
  { id: '3', slug: 'mavi-mdflam', name: 'Mavi', code: 'YT-41C', category: 'MDF Lam' },
  { id: '4', slug: 'royal-mermer', name: 'Royal Mermer', code: 'SGL-51A', category: 'Lak Panel' },
  { id: '5', slug: 'azraq', name: 'أزرق', code: 'AR-1', category: 'MDF Lam' },
];

describe('normalizePickerQuery', () => {
  it('Türkçe karakterleri ve noktalamayı sadeleştirir', () => {
    expect(normalizePickerQuery('Kayın')).toBe('kayin');
    expect(normalizePickerQuery('  ŞİŞLİ / MDF  ')).toBe('sisli mdf');
    expect(normalizePickerQuery('YT-40C')).toBe('yt 40c');
  });

  it('Arapça metni korur', () => {
    expect(normalizePickerQuery('أزرق')).toBe('أزرق');
  });
});

describe('filterQuoteProducts', () => {
  it('ada göre Türkçe karakter duyarsız arar', () => {
    expect(filterQuoteProducts(products, 'kayin').map((p) => p.name)).toEqual(['Kayın']);
    expect(filterQuoteProducts(products, 'KAYIN').map((p) => p.name)).toEqual(['Kayın']);
  });

  it('kod ve kategori üzerinde arar', () => {
    expect(filterQuoteProducts(products, 'SGL-51A').map((p) => p.slug)).toEqual(['royal-mermer']);
    expect(filterQuoteProducts(products, 'lak panel').map((p) => p.slug)).toEqual(['royal-mermer']);
  });

  it('birden fazla kelimeyi birlikte arar', () => {
    expect(filterQuoteProducts(products, 'mdf lam mavi').map((p) => p.slug)).toEqual([
      'mavi-mdflam',
    ]);
  });

  it('Arapça sorguyu eşleştirir', () => {
    expect(filterQuoteProducts(products, 'أزرق').map((p) => p.slug)).toEqual(['azraq']);
  });

  it('seçilmiş ürünleri sonuçtan çıkarır', () => {
    const result = filterQuoteProducts(products, 'mdf lam', ['mavi-mdflam']);
    expect(result.map((p) => p.slug)).not.toContain('mavi-mdflam');
    expect(result.map((p) => p.slug)).toContain('hezaren-mdflam');
  });

  it('boş sorguda öneri döndürür ve limit uygular', () => {
    expect(filterQuoteProducts(products, '', [], 2)).toHaveLength(2);
    expect(filterQuoteProducts(products, '   ', [], 10)).toHaveLength(products.length);
  });

  it('eşleşme yoksa boş döner', () => {
    expect(filterQuoteProducts(products, 'zzzz')).toEqual([]);
  });
});

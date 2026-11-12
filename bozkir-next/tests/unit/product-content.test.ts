import { describe, it, expect } from 'vitest';
import { buildProductContent } from '@/data/product-content';
import type { Product } from '@/types/product';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    slug: 'hezaren',
    name: 'Hezaren',
    category: 'MDF Lam',
    categorySlug: 'mdflam',
    images: [],
    ...overrides,
  };
}

describe('buildProductContent', () => {
  it('boş alanları kategori şablonuyla doldurur', () => {
    const content = buildProductContent(product(), 'tr');
    expect(content.shortDescription).toBe('Dekor kaplı MDF panel');
    expect(content.description).toContain('Hezaren');
    expect(content.description).toContain('MDF Lam koleksiyonunda');
    expect(content.description).toContain('Melamin reçine');
    expect(content.applications).toEqual([
      'Mutfak ve banyo dolabı',
      'Gardırop ve depolama',
      'İç mekân duvar paneli',
      'Ofis mobilyası',
    ]);
  });

  it('İngilizce ve Arapça şablonları üretir', () => {
    const en = buildProductContent(product(), 'en');
    expect(en.shortDescription).toBe('Decor-coated MDF panel');
    expect(en.description).toContain('MDF Lam collection');
    expect(en.applications?.[0]).toBe('Kitchen and bathroom cabinets');

    const ar = buildProductContent(product(), 'ar');
    expect(ar.shortDescription).toBe('لوح MDF مكسو بالديكور');
    expect(ar.description).toContain('ألواح MDF مغطاة');
    expect(ar.applications?.[0]).toBe('خزائن المطبخ والحمام');
  });

  it('admin içeriğini ezmez', () => {
    const content = buildProductContent(
      product({
        shortDescription: 'Özel kısa açıklama',
        description: 'Admin tarafından girilmiş detay.',
        applications: ['Özel uygulama'],
      }),
      'tr',
    );
    expect(content.shortDescription).toBe('Özel kısa açıklama');
    expect(content.description).toBe('Admin tarafından girilmiş detay.');
    expect(content.applications).toEqual(['Özel uygulama']);
  });

  it('yalnızca kayıtlı kalınlığı açıklamaya ekler', () => {
    const withThickness = buildProductContent(
      product({ name: '18mm Ham', categorySlug: 'mdf', category: 'MDF', thicknesses: ['18 mm'] }),
      'tr',
    );
    expect(withThickness.description).toContain('18 mm');

    const withoutThickness = buildProductContent(
      product({ categorySlug: 'mdf', category: 'MDF' }),
      'tr',
    );
    expect(withoutThickness.description).not.toContain('kalınlık seçenekleri');
  });

  it('bilinmeyen kategoride genel şablonu kullanır', () => {
    const content = buildProductContent(
      product({ category: 'Özel Koleksiyon', categorySlug: 'ozel' }),
      'tr',
    );
    expect(content.shortDescription).toBe('Bozkır Ağaç ürünü');
    expect(content.description).toContain('Özel Koleksiyon');
    expect(content.applications).toBeUndefined();
  });

  it('teknik özellik uydurmaz', () => {
    const content = buildProductContent(product(), 'en');
    expect(Object.keys(content).sort()).toEqual([
      'applications',
      'description',
      'shortDescription',
    ]);
  });
});

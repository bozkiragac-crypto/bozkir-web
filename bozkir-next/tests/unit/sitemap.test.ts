import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/products', () => ({
  getAllProducts: async () => [
    { slug: 'ornek-urun', updatedAt: '2026-01-02T03:04:05.000Z' },
    { slug: 'tarihsiz-urun' },
  ],
}));

vi.mock('@/lib/api/categories', () => ({
  getCategories: async () => [{ slug: 'mdf-lam' }],
}));

import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('ürün girişlerine gerçek güncelleme tarihini yazar', async () => {
    const entries = await sitemap();
    const product = entries.find((entry) => entry.url.endsWith('/urunler/ornek-urun'));

    expect(product?.lastModified).toBe('2026-01-02T03:04:05.000Z');
  });

  it('güncelleme tarihi olmayan ürün için lastModified uydurmaz', async () => {
    const entries = await sitemap();
    const product = entries.find((entry) => entry.url.endsWith('/urunler/tarihsiz-urun'));

    expect(product).toBeTruthy();
    expect(product?.lastModified).toBeUndefined();
  });

  it('statik ve kategori girişlerine tarih yazmaz', async () => {
    const entries = await sitemap();
    const nonProduct = entries.filter((entry) => !entry.url.includes('/urunler/'));

    expect(nonProduct.length).toBeGreaterThan(0);
    expect(nonProduct.every((entry) => entry.lastModified === undefined)).toBe(true);
  });
});

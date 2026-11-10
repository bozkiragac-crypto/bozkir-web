import { describe, expect, it } from 'vitest';
import { GET as productsGet } from '@/app/api/products/route';
import { GET as batchGet } from '@/app/api/products/batch/route';

const req = (url: string) => new Request(url);

describe('API rota doğrulaması', () => {
  it('products: geçersiz limit 400 döner', async () => {
    const res = await productsGet(req('http://localhost/api/products?limit=999'));
    expect(res.status).toBe(400);
  });

  it('products: geçerli sorgu 200 + items dizi döner', async () => {
    const res = await productsGet(req('http://localhost/api/products?limit=5'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items?: unknown };
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('products/batch: eksik slugs 400 döner', async () => {
    const res = await batchGet(req('http://localhost/api/products/batch'));
    expect(res.status).toBe(400);
  });

  it('products/batch: slug listesini çözer ve tekrarları atar', async () => {
    const listRes = await productsGet(req('http://localhost/api/products?limit=1'));
    const list = (await listRes.json()) as { items?: Array<{ slug: string }> };
    const slug = list.items?.[0]?.slug;
    if (!slug) return;

    const res = await batchGet(
      req(`http://localhost/api/products/batch?slugs=${slug},${slug}`),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items?: Array<{ slug: string }> };
    expect(body.items?.map((p) => p.slug)).toEqual([slug]);
    expect(res.headers.get('cache-control')).toContain('stale-while-revalidate=600');
  });
});

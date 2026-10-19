import { describe, expect, it } from 'vitest';
import { GET as productsGet } from '@/app/api/products/route';
import { GET as productGet } from '@/app/api/product/route';

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

  it('product: eksik slug 400 döner', async () => {
    const res = await productGet(req('http://localhost/api/product'));
    expect(res.status).toBe(400);
  });

  it('product: aşırı uzun slug 400 döner', async () => {
    const res = await productGet(req('http://localhost/api/product?slug=' + 'a'.repeat(200)));
    expect(res.status).toBe(400);
  });
});

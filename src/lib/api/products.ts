import type { Product, ProductFilters, ProductQueryResult } from '@/types/product';
import { apiGet, hasRemoteApi } from './client';

const EMPTY: ProductQueryResult = { items: [], total: 0 };

function toQuery(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.query) params.set('q', filters.query);
  if (filters.thickness) params.set('kalinlik', filters.thickness);
  if (filters.color) params.set('renk', filters.color);
  params.set('limit', String(filters.limit ?? 24));
  params.set('offset', String(filters.offset ?? 0));
  return params.toString();
}

/** Ürünler PHP JSON API'den gelir; API yoksa boş sonuç döner. */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductQueryResult> {
  if (!hasRemoteApi()) return EMPTY;
  try {
    const data = await apiGet<ProductQueryResult>(`/products?${toQuery(filters)}`, { revalidate: 300 });
    if (!data || !Array.isArray(data.items)) return EMPTY;
    return data;
  } catch {
    return EMPTY;
  }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { items } = await getProducts({ limit });
  return items;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!hasRemoteApi()) return null;
  try {
    return await apiGet<Product>(`/product?slug=${encodeURIComponent(slug)}`, { revalidate: 300 });
  } catch {
    return null;
  }
}

/** Tüm ürünler (sitemap için) — sayfalama ile toplanır. */
export async function getAllProducts(max = 1000): Promise<Product[]> {
  if (!hasRemoteApi()) return [];
  const out: Product[] = [];
  let offset = 0;
  const limit = 100;
  while (out.length < max) {
    const page = await getProducts({ limit, offset });
    out.push(...page.items);
    if (page.items.length < limit || out.length >= page.total) break;
    offset += limit;
  }
  return out;
}

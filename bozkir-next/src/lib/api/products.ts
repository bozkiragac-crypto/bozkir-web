import type { Locale } from '@/i18n/config';
import type { Product, ProductFilters, ProductQueryResult } from '@/types/product';
import { fetchProductBySlug, fetchProducts } from '@/lib/data/catalog';
import { apiGet, hasRemoteApi } from './client';

function toQuery(filters: ProductFilters = {}, locale?: Locale) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.query) params.set('q', filters.query);
  params.set('limit', String(filters.limit ?? 24));
  params.set('offset', String(filters.offset ?? 0));
  if (locale) params.set('locale', locale);
  return params.toString();
}

/**
 * Ürünler. Harici bir API tanımlıysa ondan; aksi halde uygulamanın kendi
 * sunucu veri katmanından okunur. Sözleşme her iki durumda aynıdır.
 */
export async function getProducts(
  filters: ProductFilters = {},
  locale?: Locale,
): Promise<ProductQueryResult> {
  if (!hasRemoteApi()) {
    return fetchProducts(filters, locale);
  }
  try {
    const data = await apiGet<ProductQueryResult>(`/products?${toQuery(filters, locale)}`, {
      revalidate: 300,
    });
    if (!data || !Array.isArray(data.items)) return fetchProducts(filters, locale);
    return data;
  } catch {
    // Uzak API düşerse yerel veri katmanına düş (kataloglarla tutarlı davranış).
    return fetchProducts(filters, locale);
  }
}

export async function getFeaturedProducts(limit = 8, locale?: Locale): Promise<Product[]> {
  const { items } = await getProducts({ limit }, locale);
  return items;
}

export async function getProductBySlug(slug: string, locale?: Locale): Promise<Product | null> {
  if (!hasRemoteApi()) {
    return fetchProductBySlug(slug, locale);
  }
  try {
    const localeQuery = locale ? `&locale=${locale}` : '';
    const product = await apiGet<Product>(`/product?slug=${encodeURIComponent(slug)}${localeQuery}`, {
      revalidate: 300,
    });
    return product ?? fetchProductBySlug(slug, locale);
  } catch {
    // Uzak API düşerse yerel katmana düş.
    return fetchProductBySlug(slug, locale);
  }
}

/** Tüm ürünler (sitemap için) — sayfalama ile toplanır. */
export async function getAllProducts(max = 1000): Promise<Product[]> {
  const out: Product[] = [];
  let offset = 0;
  const limit = 100;
  while (out.length < max) {
    const page = await getProducts({ limit, offset });
    out.push(...page.items);
    if (page.items.length < limit || out.length >= page.total || page.total === 0) break;
    offset += limit;
  }
  return out;
}

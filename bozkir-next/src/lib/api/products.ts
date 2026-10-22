import type { Locale } from '@/i18n/config';
import type { Product, ProductFilters, ProductQueryResult } from '@/types/product';
import {
  fetchProductBySlug,
  fetchProductFacets,
  fetchProducts,
  fetchProductsByIds,
  fetchRelatedProducts,
} from '@/lib/data/catalog';
import { apiGet, hasRemoteApi } from './client';

function toQuery(filters: ProductFilters = {}, locale?: Locale) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.surface) params.set('surface', filters.surface);
  if (filters.query) params.set('q', filters.query);
  if (filters.sort) params.set('sort', filters.sort);
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

/** Filtre paneli facet'leri (yüzey). */
export async function getProductFacets(): Promise<{ surfaces: string[] }> {
  return fetchProductFacets();
}

/** Admin'de seçilen öne çıkan ürünler; sıra korunur. */
export async function getProductsByIds(ids: string[], locale?: Locale): Promise<Product[]> {
  return fetchProductsByIds(ids, locale);
}

export async function getProductBySlug(slug: string, locale?: Locale): Promise<Product | null> {
  if (!hasRemoteApi()) {
    return fetchProductBySlug(slug, locale);
  }
  try {
    const localeQuery = locale ? `&locale=${locale}` : '';
    const product = await apiGet<Product>(
      `/product?slug=${encodeURIComponent(slug)}${localeQuery}`,
      {
        revalidate: 300,
      },
    );
    return product ?? fetchProductBySlug(slug, locale);
  } catch {
    // Uzak API düşerse yerel katmana düş.
    return fetchProductBySlug(slug, locale);
  }
}

/** Aynı kategoriden ilgili ürünler. */
export async function getRelatedProducts(
  slug: string,
  locale?: Locale,
  limit = 4,
): Promise<Product[]> {
  if (!hasRemoteApi()) {
    return fetchRelatedProducts(slug, locale, limit);
  }
  try {
    const items = (await getProducts({ category: undefined, limit: 100 }, locale)).items;
    const current = items.find((i) => i.slug === slug);
    if (!current) return [];
    return items
      .filter((i) => i.categorySlug === current.categorySlug && i.slug !== slug)
      .slice(0, limit);
  } catch {
    return fetchRelatedProducts(slug, locale, limit);
  }
}

export interface AdjacentProducts {
  prev: Product | null;
  next: Product | null;
}

/**
 * Aynı kategorideki ürünler içinde bir önceki/sonraki ürün. Liste sırası
 * ürünler sayfasıyla aynıdır; baş/son ürünlerde döngüsel davranır.
 */
export async function getAdjacentProducts(
  product: Pick<Product, 'slug' | 'categorySlug'>,
  locale?: Locale,
): Promise<AdjacentProducts> {
  const items: Product[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const page = await getProducts({ category: product.categorySlug, limit, offset }, locale);
    items.push(...page.items);
    if (page.items.length < limit || items.length >= page.total) break;
  }

  const index = items.findIndex((item) => item.slug === product.slug);
  if (index === -1 || items.length < 2) return { prev: null, next: null };

  return {
    prev: items[(index - 1 + items.length) % items.length] ?? null,
    next: items[(index + 1) % items.length] ?? null,
  };
}

/** Tüm ürünler (sitemap için) — sayfalama ile toplanır. */
export async function getAllProducts(max = Number.POSITIVE_INFINITY): Promise<Product[]> {
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

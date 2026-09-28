import type { Category } from '@/types/category';
import { fallbackCategories, primaryCategorySlugs } from '@/data/categories';
import { apiGet, hasRemoteApi } from './client';

interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  count?: number;
}

/**
 * API kategori adlarını/kapsamını verir; açıklama ve görselleri küratörlü
 * fallback verisinden zenginleştiririz. API yoksa fallback kullanılır.
 */
export async function getCategories(): Promise<Category[]> {
  if (hasRemoteApi()) {
    try {
      const apiCats = await apiGet<ApiCategory[]>('/categories', { revalidate: 600 });
      if (Array.isArray(apiCats) && apiCats.length) {
        const merged = apiCats.map((c) => {
          const fb = fallbackCategories.find((f) => f.slug === c.slug);
          return {
            id: c.slug,
            slug: c.slug,
            name: fb?.name ?? c.name,
            description: fb?.description ?? '',
            shortDescription: fb?.shortDescription,
            thumbnail: fb?.thumbnail,
            heroImage: fb?.heroImage,
            featured: fb?.featured,
            sortOrder: fb?.sortOrder,
            productCount: c.count,
          } satisfies Category;
        });
        return merged.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.name.localeCompare(b.name, 'tr'));
      }
    } catch {
      // sessizce fallback'e düş
    }
  }
  return fallbackCategories;
}

export async function getPrimaryCategories(): Promise<Category[]> {
  const all = await getCategories();
  const order = new Map(primaryCategorySlugs.map((slug, i) => [slug, i]));
  return all
    .filter((c) => order.has(c.slug))
    .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const all = await getCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

import type { Category } from '@/types/category';
import type { Locale } from '@/i18n/config';
import { fallbackCategories, primaryCategorySlugs } from '@/data/categories';
import { fetchCategories, localizedCategoryName } from '@/lib/data/catalog';
import { apiGet, hasRemoteApi } from './client';

interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  count?: number;
}

/** Kategori listesi: harici API varsa ondan, yoksa yerel veri katmanından. */
export async function getCategories(locale?: Locale): Promise<Category[]> {
  if (!hasRemoteApi()) {
    return fetchCategories(locale);
  }
  try {
    const localeQuery = locale ? `?locale=${locale}` : '';
    const apiCats = await apiGet<ApiCategory[]>(`/categories${localeQuery}`, { revalidate: 600 });
    if (Array.isArray(apiCats) && apiCats.length) {
      const merged = apiCats.map((c) => {
        const fb = fallbackCategories.find((f) => f.slug === c.slug);
        return {
          id: c.slug,
          slug: c.slug,
          name: fb ? localizedCategoryName(fb, locale) : c.name,
          description: fb?.description ?? '',
          shortDescription: fb?.shortDescription,
          thumbnail: fb?.thumbnail,
          heroImage: fb?.heroImage,
          featured: fb?.featured,
          sortOrder: fb?.sortOrder,
          productCount: c.count,
        } satisfies Category;
      });
      return merged.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.name.localeCompare(a.name, 'tr'));
    }
  } catch {
    // fallback
  }
  return fetchCategories(locale);
}

export async function getPrimaryCategories(locale?: Locale): Promise<Category[]> {
  const all = await getCategories(locale);
  const order = new Map(primaryCategorySlugs.map((slug, i) => [slug, i]));
  return all
    .filter((c) => order.has(c.slug))
    .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
}

export async function getCategoryBySlug(slug: string, locale?: Locale): Promise<Category | null> {
  const all = await getCategories(locale);
  return all.find((c) => c.slug === slug) ?? null;
}

import { asc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { DATA_TAGS } from '@/lib/data/tags';
import type { Category } from '@/types/category';
import { getDb, hasDb } from '@/lib/db/client';
import { categories } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { pickLocaleText } from '@/lib/locale-text';
import type { Locale } from '@/i18n/config';

/** DB'deki ham kategori satırları (önbellekli). */
const getAllCategoriesCached = unstable_cache(
  async (): Promise<Category[]> => {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));

    return rows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      name: String(r.name ?? ''),
      nameEn: r.nameEn ?? undefined,
      nameAr: r.nameAr ?? undefined,
      description: String(r.description ?? ''),
      descriptionEn: r.descriptionEn ?? undefined,
      descriptionAr: r.descriptionAr ?? undefined,
      shortDescription: r.shortDescription ?? undefined,
      shortDescriptionEn: r.shortDescriptionEn ?? undefined,
      shortDescriptionAr: r.shortDescriptionAr ?? undefined,
      thumbnail: r.thumbnail ? publicUrl(r.thumbnail) : undefined,
      heroImage: r.heroImage ? publicUrl(r.heroImage) : undefined,
      featured: r.featured ?? false,
      sortOrder: r.sortOrder ?? 0,
      isActive: r.isActive ?? true,
      seoTitle: r.seoTitle ?? undefined,
      seoDescription: r.seoDescription ?? undefined,
    }));
  },
  ['categories:all'],
  { tags: [DATA_TAGS.products], revalidate: 300 },
);

const getCategoriesCached = unstable_cache(
  async (): Promise<Category[]> => {
    const all = await getAllCategoriesCached();
    return all.filter((c) => c.isActive !== false);
  },
  ['categories:active'],
  { tags: [DATA_TAGS.products], revalidate: 300 },
);

/**
 * Pasif kategoriler dahil tüm meta satırları.
 *
 * `fetchCategories()` kategori listesini ürünlerden türettiği için pasif bir
 * kategorinin meta satırını görmezse onu ürünlerden yeniden üretir; panelden
 * "pasifleştir" işlemi böylece hiçbir şey yapmıyormuş gibi görünür.
 */
export async function fetchAllCategoryMeta(locale?: Locale): Promise<Category[]> {
  if (!hasDb()) return [];
  try {
    const all = await getAllCategoriesCached();
    return all.map((c) => localize(c, locale));
  } catch {
    return [];
  }
}

/** DB kategorileri (locale'e göre ad/açıklama seçilir). DB boşsa boş dizi. */
export async function fetchCategoryMeta(locale?: Locale): Promise<Category[]> {
  if (!hasDb()) return [];
  try {
    const all = await getCategoriesCached();
    return all.map((c) => localize(c, locale));
  } catch {
    return [];
  }
}

function localize(c: Category, locale?: Locale): Category {
  return {
    ...c,
    name: pickLocaleText(c.name, locale, c.nameEn, c.nameAr),
    description: pickLocaleText(c.description, locale, c.descriptionEn, c.descriptionAr),
    shortDescription: pickLocaleText(c.shortDescription ?? '', locale, c.shortDescriptionEn, c.shortDescriptionAr) || undefined,
  };
}

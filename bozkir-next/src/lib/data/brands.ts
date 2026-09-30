import { asc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { DATA_TAGS } from '@/lib/data/tags';
import type { Brand } from '@/types/brand';
import { getDb, hasDb } from '@/lib/db/client';
import { brands } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { fallbackBrands } from '@/data/brands';

const getBrandsCached = unstable_cache(
  async (): Promise<Brand[]> => {
    const db = getDb()!;
    const rows = await db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.sortOrder));
    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      logo: r.logo ? publicUrl(r.logo) : '',
      url: r.url ?? undefined,
      category: r.category ?? undefined,
      categoryEn: r.categoryEn ?? undefined,
      categoryAr: r.categoryAr ?? undefined,
      description: r.description ?? undefined,
    }));
  },
  ['brands:active'],
  { tags: [DATA_TAGS.content], revalidate: 300 },
);

/** DB markaları; DB boşsa (veya hata) statik fallback. */
export async function fetchBrands(): Promise<Brand[]> {
  if (!hasDb()) return fallbackBrands;
  try {
    const rows = await getBrandsCached();
    return rows.length ? rows : fallbackBrands;
  } catch {
    return fallbackBrands;
  }
}

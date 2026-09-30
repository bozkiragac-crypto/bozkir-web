import { asc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { DATA_TAGS } from '@/lib/data/tags';
import type { Catalog } from '@/types/catalog';
import { getDb, hasDb } from '@/lib/db/client';
import { catalogs } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { pickLocaleText } from '@/lib/data/catalog';
import type { Locale } from '@/i18n/config';

const getCatalogsCached = unstable_cache(
  async (): Promise<Catalog[]> => {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(catalogs)
      .where(eq(catalogs.isActive, true))
      .orderBy(asc(catalogs.sortOrder));

    return rows.map((r) => ({
      id: String(r.id),
      slug: r.slug,
      title: String(r.title ?? ''),
      year: Number(r.year ?? new Date().getFullYear()),
      description: String(r.description ?? ''),
      cover: r.cover ? publicUrl(String(r.cover)) : undefined,
      pdfUrl: r.pdfUrl ? publicUrl(String(r.pdfUrl)) : undefined,
      pageCount: r.pageCount ?? undefined,
      titleEn: String(r.titleEn ?? ''),
      titleAr: String(r.titleAr ?? ''),
      descriptionEn: String(r.descriptionEn ?? ''),
      descriptionAr: String(r.descriptionAr ?? ''),
    }));
  },
  ['catalogs:active'],
  { tags: [DATA_TAGS.catalogs], revalidate: 300 },
);

export async function fetchCatalogs(locale?: Locale): Promise<Catalog[]> {
  if (!hasDb()) return [];
  try {
    const all = await getCatalogsCached();
    return all.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: pickLocaleText(c.title, locale, c.titleEn, c.titleAr),
      year: c.year,
      description: pickLocaleText(c.description, locale, c.descriptionEn, c.descriptionAr),
      cover: c.cover,
      pdfUrl: c.pdfUrl,
      pageCount: c.pageCount,
    }));
  } catch {
    return [];
  }
}

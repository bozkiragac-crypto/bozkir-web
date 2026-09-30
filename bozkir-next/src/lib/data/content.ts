import { asc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { DATA_TAGS } from '@/lib/data/tags';
import type { ContentBlock, ContentItem } from '@/types/content';
import { getDb, hasDb } from '@/lib/db/client';
import { contentBlocks, contentItems } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { pickLocaleText } from '@/lib/data/catalog';
import type { Locale } from '@/i18n/config';

const getContentBlocksCached = unstable_cache(
  async (): Promise<ContentBlock[]> => {
    const db = getDb()!;
    const [blocks, items] = await Promise.all([
      db.select().from(contentBlocks).where(eq(contentBlocks.isActive, true)).orderBy(asc(contentBlocks.sortOrder)),
      db.select().from(contentItems).where(eq(contentItems.isActive, true)).orderBy(asc(contentItems.sortOrder)),
    ]);

    const grouped = new Map<string, ContentItem[]>();
    for (const row of items) {
      const list = grouped.get(row.blockKey) ?? [];
      list.push({
        id: String(row.id),
        blockKey: row.blockKey,
        title: String(row.title ?? ''),
        description: String(row.description ?? ''),
        imageUrl: publicUrl(String(row.imageUrl ?? '')),
        linkUrl: String(row.linkUrl ?? ''),
        tag: String(row.tag ?? ''),
        sortOrder: Number(row.sortOrder ?? 0),
        titleEn: String(row.titleEn ?? ''),
        titleAr: String(row.titleAr ?? ''),
        descriptionEn: String(row.descriptionEn ?? ''),
        descriptionAr: String(row.descriptionAr ?? ''),
        tagEn: String(row.tagEn ?? ''),
        tagAr: String(row.tagAr ?? ''),
      });
      grouped.set(row.blockKey, list);
    }

    return blocks.map((b) => ({
      key: b.key,
      title: String(b.title ?? ''),
      subtitle: String(b.subtitle ?? ''),
      body: String(b.body ?? ''),
      titleEn: String(b.titleEn ?? ''),
      titleAr: String(b.titleAr ?? ''),
      subtitleEn: String(b.subtitleEn ?? ''),
      subtitleAr: String(b.subtitleAr ?? ''),
      bodyEn: String(b.bodyEn ?? ''),
      bodyAr: String(b.bodyAr ?? ''),
      items: grouped.get(b.key) ?? [],
    }));
  },
  ['content:blocks'],
  { tags: [DATA_TAGS.content], revalidate: 300 },
);

export async function fetchContentBlocks(locale?: Locale): Promise<ContentBlock[]> {
  if (!hasDb()) return [];
  try {
    const all = await getContentBlocksCached();
    return all.map((b) => ({
      key: b.key,
      title: pickLocaleText(b.title, locale, b.titleEn, b.titleAr),
      subtitle: pickLocaleText(b.subtitle, locale, b.subtitleEn, b.subtitleAr),
      body: pickLocaleText(b.body, locale, b.bodyEn, b.bodyAr),
      items: b.items.map((it) => ({
        id: it.id,
        blockKey: it.blockKey,
        title: pickLocaleText(it.title, locale, it.titleEn, it.titleAr),
        description: pickLocaleText(it.description, locale, it.descriptionEn, it.descriptionAr),
        imageUrl: it.imageUrl,
        linkUrl: it.linkUrl,
        tag: pickLocaleText(it.tag, locale, it.tagEn, it.tagAr),
        sortOrder: it.sortOrder,
      })),
    }));
  } catch {
    return [];
  }
}

export interface AboutStat {
  value: string;
  label: string;
}
export interface AboutValue {
  title: string;
  text: string;
}
export interface AboutMilestone {
  year: string;
  title: string;
  text: string;
}

/**
 * Hakkımızda içeriği (stats/values/timeline) — `about` content bloğunun
 * öğelerinden türetilir. `tag` alanı grubu belirler: stat | value | timeline.
 * DB boşsa boş dizi (çağıran sözlük fallback'ine düşer).
 */
export async function fetchAboutContent(locale?: Locale): Promise<{
  stats: AboutStat[];
  values: AboutValue[];
  timeline: AboutMilestone[];
}> {
  const block = (await fetchContentBlocks(locale)).find((b) => b.key === 'about');
  const stats: AboutStat[] = [];
  const values: AboutValue[] = [];
  const timeline: AboutMilestone[] = [];
  for (const it of block?.items ?? []) {
    const group = it.tag.trim().toLowerCase();
    if (group === 'stat') stats.push({ value: it.title, label: it.description });
    else if (group === 'value') values.push({ title: it.title, text: it.description });
    else if (group === 'timeline') timeline.push({ year: it.title, title: it.description, text: it.linkUrl });
  }
  return { stats, values, timeline };
}

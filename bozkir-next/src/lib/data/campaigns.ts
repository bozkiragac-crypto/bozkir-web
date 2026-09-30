import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { DATA_TAGS } from '@/lib/data/tags';
import type { Campaign } from '@/types/campaign';
import { getDb, hasDb } from '@/lib/db/client';
import { campaigns } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { pickLocaleText } from '@/lib/data/catalog';
import type { Locale } from '@/i18n/config';

/** Aktif + tarih aralığında kampanyalar (etiketli önbellek). */
const getCampaignsCached = unstable_cache(
  async (): Promise<Campaign[]> => {
    const db = getDb()!;
    const now = new Date();
    const rows = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          or(isNull(campaigns.startsAt), lte(campaigns.startsAt, now)),
          or(isNull(campaigns.endsAt), gte(campaigns.endsAt, now)),
        ),
      )
      .orderBy(asc(campaigns.sortOrder));

    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      imageUrl: publicUrl(String(r.imageUrl ?? '')),
      linkUrl: String(r.linkUrl ?? ''),
      linkLabel: String(r.linkLabel ?? 'İncele'),
      sortOrder: Number(r.sortOrder ?? 0),
      titleEn: String(r.titleEn ?? ''),
      titleAr: String(r.titleAr ?? ''),
      descriptionEn: String(r.descriptionEn ?? ''),
      descriptionAr: String(r.descriptionAr ?? ''),
      linkLabelEn: String(r.linkLabelEn ?? ''),
      linkLabelAr: String(r.linkLabelAr ?? ''),
    }));
  },
  ['campaigns:active'],
  { tags: [DATA_TAGS.campaigns], revalidate: 300 },
);

export async function fetchCampaigns(locale?: Locale): Promise<Campaign[]> {
  if (!hasDb()) return [];
  try {
    const all = await getCampaignsCached();
    return all.map((c) => ({
      id: c.id,
      title: pickLocaleText(c.title, locale, c.titleEn, c.titleAr),
      description: pickLocaleText(c.description, locale, c.descriptionEn, c.descriptionAr),
      imageUrl: c.imageUrl,
      linkUrl: c.linkUrl,
      linkLabel: pickLocaleText(c.linkLabel, locale, c.linkLabelEn, c.linkLabelAr),
      sortOrder: c.sortOrder,
    }));
  } catch {
    return [];
  }
}

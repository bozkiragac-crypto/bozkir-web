import type { ContentBlock } from '@/types/content';
import { fallbackContent } from '@/data/content';
import { fetchContentBlocks } from '@/lib/data/content';
import { pickLocaleText } from '@/lib/locale-text';
import { apiGet, hasRemoteApi } from './client';
import type { Locale } from '@/i18n/config';

/** Ham (TR ağırlıklı) bloğu istenen dile çevirir; eksik alanlar TR'ye düşer. */
function localizeBlock(block: ContentBlock, locale?: Locale): ContentBlock {
  return {
    ...block,
    title: pickLocaleText(block.title, locale, block.titleEn, block.titleAr),
    subtitle: pickLocaleText(block.subtitle, locale, block.subtitleEn, block.subtitleAr),
    body: pickLocaleText(block.body, locale, block.bodyEn, block.bodyAr),
    items: block.items.map((it) => ({
      ...it,
      title: pickLocaleText(it.title, locale, it.titleEn, it.titleAr),
      description: pickLocaleText(it.description, locale, it.descriptionEn, it.descriptionAr),
      tag: pickLocaleText(it.tag, locale, it.tagEn, it.tagAr),
    })),
  };
}

async function fetchAll(locale?: Locale): Promise<ContentBlock[]> {
  if (!hasRemoteApi()) {
    return fetchContentBlocks(locale);
  }
  try {
    const query = locale ? `?locale=${locale}` : '';
    const data = await apiGet<ContentBlock[]>(`/content${query}`, { revalidate: 300 });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Tek blok: DB varsa onu, yoksa taslağı döndürür (alan bazında birleştirir). */
export async function getContentBlock(key: string, locale?: Locale): Promise<ContentBlock | null> {
  const fallback = fallbackContent[key] ? localizeBlock(fallbackContent[key]!, locale) : null;
  const blocks = await fetchAll(locale);
  const found = blocks.find((b) => b.key === key);
  if (!found) return fallback;

  return {
    key: found.key,
    title: found.title || fallback?.title || '',
    subtitle: found.subtitle || fallback?.subtitle || '',
    body: found.body || fallback?.body || '',
    items: found.items && found.items.length ? found.items : (fallback?.items ?? []),
  };
}

/** Anasayfa için tüm bloklar. */
export async function getHomeContent(locale?: Locale): Promise<ContentBlock[]> {
  const keys: string[] = ['gallery', 'guide', 'applications', 'process', 'faq', 'testimonials'];
  const blocks = await Promise.all(keys.map((k) => getContentBlock(k, locale)));
  return blocks.filter((b): b is ContentBlock => b !== null);
}

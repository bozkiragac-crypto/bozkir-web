import type { Catalog } from '@/types/catalog';
import { fallbackCatalogs } from '@/data/catalogs';
import { fetchCatalogs } from '@/lib/data/catalogs';
import { pickLocaleText } from '@/lib/data/catalog';
import { apiGet, hasRemoteApi } from './client';
import type { Locale } from '@/i18n/config';

export async function getCatalogs(locale?: Locale): Promise<Catalog[]> {
  if (hasRemoteApi()) {
    try {
      const query = locale ? `?locale=${locale}` : '';
      const data = await apiGet<Catalog[]>(`/catalogs${query}`, { revalidate: 600 });
      if (Array.isArray(data) && data.length) return data;
    } catch {
      // sessizce yerel katmana düş
    }
  }

  // DB'de kayıt varsa onu kullan; yoksa statik taslağa düş.
  const fromDb = await fetchCatalogs(locale);
  if (fromDb.length) return fromDb;

  return fallbackCatalogs.map((c) => ({
    ...c,
    title: pickLocaleText(c.title, locale, c.titleEn, c.titleAr),
    description: pickLocaleText(c.description, locale, c.descriptionEn, c.descriptionAr),
  }));
}

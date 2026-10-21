import { cache } from 'react';
import { headers } from 'next/headers';
import { getSiteSettings } from '@/lib/data/settings';
import { defaultLocale, isLocale, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';
import { applyTextOverrides } from './overrides';

/**
 * Middleware'in yazdığı `x-locale` başlığından aktif dili okur.
 * Yalnızca statik üretilemeyen özel dosyalarda (not-found, global-error) kullanılır;
 * normal sayfa/bileşenlerde locale `params`'tan prop olarak taşınır (statik/ISR için).
 */
export async function getServerLocale(): Promise<Locale> {
  const h = await headers();
  const value = h.get('x-locale') ?? undefined;
  return isLocale(value) ? value : defaultLocale;
}

/** Locale prop'undan senkron sözlük (override'sız; fallback/yardımcılar için). */
export function dictFor(locale: Locale | undefined): Dictionary {
  return getDictionary(locale ?? defaultLocale);
}

/**
 * İstek başına admin override'lı sözlük. React `cache` ile aynı istekte tek
 * kez okunur; `getSiteSettings` zaten etiketli önbellek kullanır.
 */
export const dictForRequest = cache(async (locale: Locale | undefined): Promise<Dictionary> => {
  const lang = locale ?? defaultLocale;
  const settings = await getSiteSettings();
  return applyTextOverrides(getDictionary(lang), lang, settings.texts);
});

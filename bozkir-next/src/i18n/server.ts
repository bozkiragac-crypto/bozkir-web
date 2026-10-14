import { headers } from 'next/headers';
import { defaultLocale, isLocale, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

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

/** Locale prop'undan senkron sözlük. */
export function dictFor(locale: Locale | undefined): Dictionary {
  return getDictionary(locale ?? defaultLocale);
}

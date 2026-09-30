import type { Locale } from '@/i18n/config';

/** Locale için çeviri metni seçer; çeviri boşsa Türkçeye düşer. */
export function pickLocaleText(
  tr: string,
  locale: Locale | undefined,
  en?: string | null,
  ar?: string | null,
): string {
  if (locale === 'en') return String(en ?? '').trim() || tr;
  if (locale === 'ar') return String(ar ?? '').trim() || tr;
  return tr;
}

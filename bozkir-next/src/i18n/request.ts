import { cookies, headers } from 'next/headers';
import { defaultLocale, isLocale, type Locale } from './config';

const LOCALE_COOKIE = 'bozkir_locale';

/**
 * Bakım sayfası gibi middleware dışındaki uçlarda dili çözer.
 * Öncelik: x-locale başlığı → dil çerezi → Accept-Language → varsayılan.
 */
export async function resolveLocaleFromRequest(): Promise<Locale> {
  const [h, c] = await Promise.all([headers(), cookies()]);

  const headerLocale = h.get('x-locale') ?? undefined;
  if (isLocale(headerLocale)) return headerLocale;

  const cookieLocale = c.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const accept = h.get('accept-language') ?? '';
  for (const part of accept.split(',')) {
    const base = part.trim().split(';')[0]?.split('-')[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

export const locales = ['tr', 'en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'tr';

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export const localeDir: Record<Locale, 'ltr' | 'rtl'> = {
  tr: 'ltr',
  en: 'ltr',
  ar: 'rtl',
};

/** Sayfa adresi dil önekiyle üretilir: localizePath('tr', '/urunler') → '/tr/urunler' */
export function localizePath(locale: Locale, path = '/'): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/** Mevcut yoldan dil öneğini değiştirir (hreflang anahtarları için). */
export function switchLocaleInPath(pathname: string, next: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length && isLocale(segments[0])) segments[0] = next;
  else segments.unshift(next);
  return `/${segments.join('/')}`;
}

export const localeLabels: Record<Locale, { native: string; english: string }> = {
  tr: { native: 'Türkçe', english: 'Turkish' },
  en: { native: 'English', english: 'English' },
  ar: { native: 'العربية', english: 'Arabic' },
};

export const localeHtmlLang: Record<Locale, string> = { tr: 'tr-TR', en: 'en', ar: 'ar' };

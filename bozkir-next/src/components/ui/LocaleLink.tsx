'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';

/** Site içi bağlantıları aktif dil öneğiyle ekler: '/urunler' → '/tr/urunler' */
export function LocaleLink({
  href,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & { href: string }) {
  const params = useParams();
  const raw = typeof params?.locale === 'string' ? params.locale : undefined;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;

  // Zaten dil öneki taşıyan veya dış bağlantı olan href'ler olduğu gibi bırakılır.
  const isExternal = /^(https?:|mailto:|tel:|#|\/media\/|\/api\/)/.test(href);
  const hasLocale = href === `/${locale}` || href.startsWith(`/${locale}/`);
  const localized = isExternal || hasLocale ? href : `/${locale}${href === '/' ? '' : href}`;

  return (
    <Link href={localized} {...rest}>
      {children}
    </Link>
  );
}

/** Locale bilinmiyorsa (sunucu bileşeni) kullanılan yardımcı. */
export function withLocale(locale: string | undefined, href: string): string {
  const l: Locale = isLocale(locale) ? locale : defaultLocale;
  const isExternal = /^(https?:|mailto:|tel:|#|\/media\/|\/api\/)/.test(href);
  const hasLocale = href === `/${l}` || href.startsWith(`/${l}/`);
  if (isExternal || hasLocale) return href;
  return `/${l}${href === '/' ? '' : href}`;
}

import type { Metadata } from 'next';
import { unstable_noStore } from 'next/cache';
import { siteConfig } from '@/config/site';
import { defaultLocale, locales, switchLocaleInPath, type Locale } from '@/i18n/config';
import { getSiteSettingsFresh } from '@/lib/data/settings';

interface BuildMetadataInput {
  title: string;
  description?: string;
  path?: string;
  /** `null` verilirse OG görseli dosya-convention (opengraph-image) tarafından üretilir. */
  image?: string | null;
  /** Next.js Metadata OpenGraph yalnızca bu türleri kabul eder. */
  type?: 'website' | 'article';
  noIndex?: boolean;
  /** Aktif dil; verilirse canonical ve hreflang dil önekli üretilir. */
  locale?: Locale;
}

export function absoluteUrl(path = '/') {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Site geneli metadata: admin panelindeki SEO ayarlarını okur,
 * boş alanlarda `siteConfig` varsayılanlarına düşer.
 */
export async function siteMetadata(locale?: Locale): Promise<Metadata> {
  // SEO ayarları panelden değiştirilebilir; statik HTML'e gömülüp
  // güncellenmemesini önlemek için metadata istek başına okunur.
  unstable_noStore();
  let seoTitle = '';
  let seoDescription = '';
  let ogImage = '';
  try {
    const s = await getSiteSettingsFresh();
    seoTitle = s.seoTitle;
    seoDescription = s.seoDescription;
    ogImage = s.ogImage;
  } catch {
    // DB yoksa varsayılanlar
  }
  return buildMetadata({
    title: seoTitle || `${siteConfig.name} | Malzemenin Yeni Formu`,
    description: seoDescription || siteConfig.description,
    image: ogImage || '/images/og-home.jpg',
    path: '/',
    locale,
  });
}

/** Dil önekli mutlak URL (JSON-LD ve paylaşım bağlantıları için). */
export function localeUrl(locale: Locale | undefined, path = '/') {
  if (!locale) return absoluteUrl(path);
  return absoluteUrl(`/${locale}${path === '/' ? '' : path}`);
}

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  image = '/images/og-home.jpg',
  type = 'website',
  noIndex = false,
  locale,
}: BuildMetadataInput): Metadata {
  const withLocale = locale ? `/${locale}${path === '/' ? '' : path}` : path;
  const url = absoluteUrl(withLocale);
  const imageUrl = image ? (image.startsWith('http') ? image : absoluteUrl(image)) : null;

  // hreflang: her dil için aynı yolun karşılığı + x-default.
  const languages: Record<string, string> = {};
  if (locale) {
    for (const l of locales) {
      languages[l] = absoluteUrl(switchLocaleInPath(withLocale, l));
    }
    languages['x-default'] = absoluteUrl(switchLocaleInPath(withLocale, defaultLocale));
  }

  return {
    title,
    description,
    alternates: { canonical: url, ...(locale ? { languages } : {}) },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.legalName,
      locale: locale === 'en' ? 'en_US' : locale === 'ar' ? 'ar_AR' : 'tr_TR',
      type,
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

/** Organization + WebSite + SearchAction şeması (site geneli). */
export function organizationJsonLd() {
  const [lat, lng] = siteConfig.warehouse.coords.split(',').map((v) => Number(v.trim()));
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'Store'],
    '@id': absoluteUrl('/#store'),
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: absoluteUrl('/icon-512.png'),
    image: absoluteUrl('/images/og-home.jpg'),
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: '$$',
    currenciesAccepted: 'TRY',
    paymentAccepted: 'Nakit, Kredi Kartı, Havale',
    sameAs: [siteConfig.social.instagram, siteConfig.social.facebook].filter(Boolean),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.phone,
        contactType: 'customer service',
        areaServed: 'TR',
        availableLanguage: ['Turkish', 'English', 'Arabic'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
    ...(Number.isFinite(lat) && Number.isFinite(lng)
      ? {
          geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng },
          hasMap: `https://www.google.com/maps?q=${encodeURIComponent(siteConfig.warehouse.coords)}`,
        }
      : {}),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:00',
        closes: '14:00',
      },
    ],
  };
}

/** WebSite + SearchAction (Sitelinks search box) — ana sayfada basılır. */
export function websiteJsonLd(locale: Locale = defaultLocale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.legalName,
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl(`/${locale}/urunler?q={search_term_string}`),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], locale?: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: localeUrl(locale, item.path),
    })),
  };
}

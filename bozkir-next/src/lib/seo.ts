import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { defaultLocale, locales, switchLocaleInPath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { applyTextOverrides } from '@/i18n/overrides';
import { getSiteSettings } from '@/lib/data/settings';

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
  /** OpenGraph site adı; boşsa siteConfig.legalName. */
  siteName?: string;
}

export function absoluteUrl(path = '/') {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Sayfalama canonical'ı: 1. sayfa temiz yolu korur, sonraki sayfalar
 * `?sayfa=N` ile kendine canonical verir. Filtre parametreleri canonical'a
 * girmez; böylece aynı içeriğin onlarca varyantı indekslenmez.
 */
export function paginatedPath(basePath: string, page: number, param = 'sayfa'): string {
  if (!Number.isFinite(page) || page <= 1) return basePath;
  const cleanPage = Math.floor(page);
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}${param}=${cleanPage}`;
}

/**
 * JSON-LD'yi `<script type="application/ld+json">` içine güvenle gömer.
 * `JSON.stringify` `<` kaçırmadığı için, DB'den gelen içerik `</script>` ile
 * script etiketinden çıkabilir (XSS). Bu yardımcı `< > &` ve satır ayraçlarını kaçırır.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Site geneli metadata: admin panelindeki SEO ayarlarını okur,
 * boş alanlarda `siteConfig` varsayılanlarına düşer.
 */
export async function siteMetadata(locale?: Locale): Promise<Metadata> {
  // Ayarlar tag-revalidate ile önbelleklenir; admin kaydında tazelenir.
  let seoTitle = '';
  let seoDescription = '';
  let ogImage = '';
  let siteName: string = siteConfig.legalName;
  let favicon = '/favicon.ico';
  const lang = locale ?? 'tr';
  let dict = getDictionary(lang);
  try {
    const s = await getSiteSettings();
    seoTitle = s.seoTitle;
    seoDescription = s.seoDescription;
    ogImage = s.ogImage;
    siteName = s.identity.legalName || siteName;
    favicon = s.identity.favicon || favicon;
    dict = applyTextOverrides(dict, lang, s.texts);
  } catch {
    // DB yoksa varsayılanlar
  }
  return {
    ...buildMetadata({
      title: seoTitle || dict.meta.home,
      description: seoDescription || dict.meta.homeDescription,
      image: ogImage || '/images/og-home.jpg',
      path: '/',
      locale,
      siteName,
    }),
    // `apple` ayrıca verilmezse dosya-convention ikonu `icons` tarafından ezilir.
    icons: { icon: favicon, apple: '/apple-icon.png' },
    // PWA / mobil ana ekran deneyimi.
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: 'default',
    },
    formatDetection: { telephone: false },
  };
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
  siteName = siteConfig.legalName as string,
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
      siteName,
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

export interface OrganizationContact {
  phone: string;
  email: string;
  address: {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
    coords?: string;
  };
  warehouse: { coords: string };
}

/** Organization + WebSite + SearchAction şeması (site geneli). */
export function organizationJsonLd(
  social?: string[],
  siteName: string = siteConfig.legalName,
  logo: string = '/icon-512.png',
  contact?: OrganizationContact,
) {
  const phone = contact?.phone || siteConfig.phone;
  const email = contact?.email || siteConfig.email;
  const address = contact?.address ?? siteConfig.address;
  const warehouse = contact?.warehouse ?? siteConfig.warehouse;
  const [lat, lng] = warehouse.coords.split(',').map((v) => Number(v.trim()));
  const sameAs = (social && social.length > 0
    ? social
    : [siteConfig.social.instagram, siteConfig.social.facebook]
  ).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'Store'],
    '@id': absoluteUrl('/#store'),
    name: siteName,
    url: siteConfig.url,
    logo: absoluteUrl(logo),
    image: absoluteUrl('/images/og-home.jpg'),
    telephone: phone,
    email,
    priceRange: '$$',
    currenciesAccepted: 'TRY',
    paymentAccepted: 'Nakit, Kredi Kartı, Havale',
    sameAs,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: phone,
        contactType: 'customer service',
        areaServed: 'TR',
        availableLanguage: ['Turkish', 'English', 'Arabic'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.locality,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    ...(Number.isFinite(lat) && Number.isFinite(lng)
      ? {
          geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng },
          hasMap: `https://www.google.com/maps?q=${encodeURIComponent(warehouse.coords)}`,
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
export function websiteJsonLd(
  locale: Locale = defaultLocale,
  siteName: string = siteConfig.legalName,
  description?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale,
    ...(description ? { description } : {}),
    publisher: { '@id': absoluteUrl('/#store') },
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

/** Liste sayfaları için ItemList şeması; adet ve mutlak URL'ler birlikte verilir. */
export function itemListJsonLd(
  items: { name: string; path: string }[],
  locale?: Locale,
  name?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(name ? { name } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: localeUrl(locale, item.path),
      name: item.name,
    })),
  };
}

export interface ProductJsonLdInput {
  name: string;
  description: string;
  url: string;
  category: string;
  brandName: string;
  code?: string;
  images?: string[];
  /** Yüzey, kalınlık, renk, ölçü gibi gerçek ürün özellikleri. */
  properties?: { name: string; value: string }[];
}

/**
 * Ürün şeması. Fiyat veritabanında tutulmadığı için `offers` **bilinçli olarak
 * eklenmez**; uydurma fiyat/Stok bilgisi SEO'ya zarar verir. Gerçek özellikler
 * `additionalProperty` ile zenginleştirilir.
 */
export function productJsonLd(input: ProductJsonLdInput) {
  const images = (input.images ?? []).filter(Boolean).map((image) => absoluteUrl(image));
  const properties = (input.properties ?? []).filter((p) => p.name && p.value);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': input.url,
    name: input.name,
    description: input.description,
    url: input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    category: input.category,
    brand: { '@type': 'Brand', name: input.brandName },
    ...(input.code ? { sku: input.code, mpn: input.code } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(properties.length > 0
      ? {
          additionalProperty: properties.map((property) => ({
            '@type': 'PropertyValue',
            name: property.name,
            value: property.value,
          })),
        }
      : {}),
  };
}

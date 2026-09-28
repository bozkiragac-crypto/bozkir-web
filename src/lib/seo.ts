import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

interface BuildMetadataInput {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  /** Next.js Metadata OpenGraph yalnızca bu türleri kabul eder. */
  type?: 'website' | 'article';
  noIndex?: boolean;
}

export function absoluteUrl(path = '/') {
  return new URL(path, siteConfig.url).toString();
}

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  image = '/images/og-home.jpg',
  type = 'website',
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.legalName,
      locale: 'tr_TR',
      type,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

/** Organization + WebSite şeması (ana sayfa). */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: absoluteUrl('/images/brands/yildiz-entegre.webp'),
    telephone: siteConfig.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

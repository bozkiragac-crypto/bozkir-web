import { breadcrumbJsonLd } from '@/lib/seo';
import type { Locale } from '@/i18n/config';

/** Sayfalara BreadcrumbList JSON-LD basar. */
export function BreadcrumbScript({
  items,
  locale,
}: {
  items: { name: string; path: string }[];
  locale: Locale;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(items, locale)) }}
    />
  );
}

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { CatalogSection } from '@/components/home/CatalogSection';
import { QuoteCTA } from '@/components/home/QuoteCTA';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  return buildMetadata({
    title: dict.pages.catalog.metaTitle,
    description: dict.pages.catalog.metaDescription,
    path: '/katalog',
    locale: lang,
  });
}

export default async function CatalogPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const c = dict.pages.catalog;

  return (
    <>
      <BreadcrumbScript locale={lang} items={[{ name: c.crumbHome, path: '/' }, { name: c.crumb, path: '/katalog' }]} />
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle}
        description={c.heroDescription}
        crumbs={[
          { label: c.crumbHome, href: '/' },
          { label: c.crumb },
        ]}
      />
      <CatalogSection locale={lang} />
      <QuoteCTA locale={lang} />
    </>
  );
}

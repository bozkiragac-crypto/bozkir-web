import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { fetchBrands } from '@/lib/data/brands';
import { PageHero } from '@/components/ui/PageHero';
import { BrandPartners } from '@/components/home/BrandPartners';
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
    title: dict.pages.dealers.metaTitle,
    description: dict.pages.dealers.metaDescription,
    path: '/bayilikler',
    image: '/images/categories/kapi.webp',
    locale: lang,
  });
}

export default async function DealersPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const d = dict.pages.dealers;
  const brands = await fetchBrands();

  return (
    <>
      <BreadcrumbScript locale={lang} items={[{ name: d.crumbHome, path: '/' }, { name: d.crumb, path: '/bayilikler' }]} />
      <PageHero
        eyebrow={d.heroEyebrow}
        title={d.heroTitle}
        description={d.heroDescription}
        crumbs={[
          { label: d.crumbHome, href: '/' },
          { label: d.crumb },
        ]}
      />
      <div className="-mt-16">
        <BrandPartners brands={brands} locale={lang} />
      </div>
      <QuoteCTA locale={lang} />
    </>
  );
}

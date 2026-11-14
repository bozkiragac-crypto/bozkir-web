import type { Metadata } from 'next';
import { getCategories } from '@/lib/api/categories';
import { buildMetadata, itemListJsonLd, jsonLdString } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';
import { isLocale } from '@/i18n/config';
import { dictForRequest } from '@/i18n/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = await dictForRequest(locale ?? 'tr');
  return buildMetadata({
    title: dict.categories.metaTitle,
    description: dict.categories.metaDescription,
    path: '/kategoriler',
    locale,
  });
}

export default async function CategoriesPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = await dictForRequest(lang);
  const categories = await getCategories(lang);

  return (
    <>
      <BreadcrumbScript
        locale={lang}
        items={[
          { name: dict.common.home, path: '/' },
          { name: dict.nav.collections, path: '/kategoriler' },
        ]}
      />
      {categories.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdString(
              itemListJsonLd(
                categories.map((c) => ({ name: c.name, path: `/kategoriler/${c.slug}` })),
                lang,
                dict.categories.title,
              ),
            ),
          }}
        />
      )}
      <PageHero
        eyebrow={dict.nav.collections}
        title={dict.categories.title}
        description={dict.categories.description}
        crumbs={[
          { label: dict.common.home, href: '/' },
          { label: dict.nav.collections },
        ]}
      />
      <CategoryStrip categories={categories} locale={lang} />
    </>
  );
}

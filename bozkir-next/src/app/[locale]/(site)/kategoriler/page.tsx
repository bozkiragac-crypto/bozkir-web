import type { Metadata } from 'next';
import { getCategories } from '@/lib/api/categories';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
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
  const dict = getDictionary(lang);
  const categories = await getCategories(lang);

  return (
    <>
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

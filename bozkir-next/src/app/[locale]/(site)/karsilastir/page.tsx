import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { CompareView } from './CompareView';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  return buildMetadata({
    title: dict.pages.compare.metaTitle,
    description: dict.pages.compare.metaDescription,
    path: '/karsilastir',
    noIndex: true,
    locale: lang,
  });
}

export default function ComparePage() {
  return <CompareView />;
}

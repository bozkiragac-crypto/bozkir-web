import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { FavoritesView } from './FavoritesView';
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
    title: dict.pages.favorites.metaTitle,
    description: dict.pages.favorites.metaDescription,
    path: '/favoriler',
    noIndex: true,
    locale: lang,
  });
}

export default function FavoritesPage() {
  return <FavoritesView />;
}

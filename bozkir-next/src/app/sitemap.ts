import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getCategories } from '@/lib/api/categories';
import { getAllProducts } from '@/lib/api/products';
import { defaultLocale, locales } from '@/i18n/config';

export const revalidate = 3600;

/** Her yol için tüm dil varyantlarını `alternates.languages` olarak üretir. */
function entry(path: string, lastModified: Date, changeFrequency: 'weekly' | 'monthly', priority: number) {
  const clean = path === '/' ? '' : path;
  const base = siteConfig.url.replace(/\/$/, '');
  const languages: Record<string, string> = {
    tr: `${base}/tr${clean}`,
    en: `${base}/en${clean}`,
    ar: `${base}/ar${clean}`,
    'x-default': `${base}/tr${clean}`,
  };
  return {
    url: languages[defaultLocale]!,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [categories, products] = await Promise.all([getCategories(), getAllProducts(1000)]);

  const staticRoutes: { path: string; priority: number; freq: 'weekly' | 'monthly' }[] = [
    { path: '/', priority: 1, freq: 'weekly' },
    { path: '/urunler', priority: 0.9, freq: 'weekly' },
    { path: '/kategoriler', priority: 0.8, freq: 'weekly' },
    { path: '/hakkimizda', priority: 0.6, freq: 'monthly' },
    { path: '/bayilikler', priority: 0.6, freq: 'monthly' },
    { path: '/katalog', priority: 0.6, freq: 'monthly' },
    { path: '/sss', priority: 0.5, freq: 'monthly' },
    { path: '/iletisim', priority: 0.6, freq: 'monthly' },
    { path: '/teklif-al', priority: 0.7, freq: 'monthly' },
  ];

  return [
    ...staticRoutes.map((r) => entry(r.path, now, r.freq, r.priority)),
    ...categories.map((c) => entry(`/kategoriler/${c.slug}`, now, 'weekly', 0.7)),
    ...products.map((p) => entry(`/urunler/${p.slug}`, now, 'weekly', 0.65)),
  ];
}

export { locales };

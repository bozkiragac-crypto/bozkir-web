import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getCategories } from '@/lib/api/categories';
import { getAllProducts } from '@/lib/api/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '');
  const now = new Date();

  const [categories, products] = await Promise.all([getCategories(), getAllProducts(1000)]);

  const staticRoutes: { path: string; priority: number; freq: 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1, freq: 'weekly' },
    { path: '/urunler', priority: 0.9, freq: 'weekly' },
    { path: '/kategoriler', priority: 0.8, freq: 'weekly' },
    { path: '/hakkimizda', priority: 0.6, freq: 'monthly' },
    { path: '/bayilikler', priority: 0.6, freq: 'monthly' },
    { path: '/katalog', priority: 0.6, freq: 'monthly' },
    { path: '/iletisim', priority: 0.6, freq: 'monthly' },
    { path: '/teklif-al', priority: 0.7, freq: 'monthly' },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${base}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...categories.map((c) => ({
      url: `${base}/kategoriler/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/urunler/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    })),
  ];
}

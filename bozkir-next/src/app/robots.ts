import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/tr/favoriler', '/en/favoriler', '/ar/favoriler', '/tr/karsilastir', '/en/karsilastir', '/ar/karsilastir'],
      },
    ],
    sitemap: `${siteConfig.url.replace(/\/$/, '')}/sitemap.xml`,
  };
}

import type { Catalog } from '@/types/catalog';

/**
 * Gerçek katalog kaydı. API tanımlı olduğunda bu liste yerine
 * API'den gelen veri kullanılır (bkz. lib/api/catalogs.ts).
 */
export const fallbackCatalogs: Catalog[] = [
  {
    id: 'yildiz-trend-2026-2028',
    slug: 'yildiz-trend-2026-2028',
    title: 'Yıldız Trend 2026–28 · MDF Lam & Suntalam Kartelası',
    year: 2026,
    description:
      'Yıldız Entegre Yıldız Trend serisi MDF lam ve suntalam dekor kartelası. Güncel dekor ve renk seçenekleri.',
    cover: '/images/categories/mdflam.webp',
    pdfUrl: '/catalog/yildiz-trend-2026-2028-mdflam-suntalam.pdf',
  },
];

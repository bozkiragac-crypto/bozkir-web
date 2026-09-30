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
    titleEn: 'Yıldız Trend 2026–28 · MDF Lam & Suntalam Colour Chart',
    titleAr: 'يلدز تريند 2026–28 · كتالوج ألوان MDF Lam وسونتالام',
    descriptionEn: 'Yıldız Entegre Yıldız Trend series MDF lam and suntalam decor chart. Current decor and colour options.',
    descriptionAr: 'كتالوج ألوان سلسلة يلدز تريند من يلدز إنتيغري لـ MDF المبطّن والسونتالام. خيارات الديكور والألوان الحالية.',
    cover: '/images/categories/mdflam.webp',
    pdfUrl: '/catalog/yildiz-trend-2026-2028-mdflam-suntalam.pdf',
  },
];

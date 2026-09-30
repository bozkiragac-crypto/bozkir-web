import type { Brand } from '@/types/brand';

/** Yetkili bayilik / çalışılan markalar (mevcut siteden). */
export const fallbackBrands: Brand[] = [
  {
    id: 'yildiz-entegre',
    name: 'Yıldız Entegre',
    logo: '/images/brands/yildiz-entegre.webp',
    url: 'https://www.yildizentegre.com',
    category: 'MDF / Yonga Levha',
    categoryEn: 'MDF / Particleboard',
    categoryAr: 'MDF / ألواح الجسيمات',
  },
  {
    id: 'teverpan',
    name: 'Teverpan MDF',
    logo: '/images/brands/teverpan.webp',
    url: 'http://www.teverpan.com.tr',
    category: 'MDF Levha',
    categoryEn: 'MDF Board',
    categoryAr: 'ألواح MDF',
  },
  {
    id: 'apel-tutkal',
    name: 'Apel Tutkal',
    logo: '/images/brands/apel-tutkal.webp',
    url: 'https://www.betakimya.com.tr',
    category: 'Yapıştırıcı',
    categoryEn: 'Adhesive',
    categoryAr: 'مواد لاصقة',
  },
  {
    id: 'hsc-plastik',
    name: 'HSÇ Plastik',
    logo: '/images/brands/hsc-plastik.webp',
    url: 'https://hscplastik.com',
    category: 'PVC Kenar Bant',
    categoryEn: 'PVC Edge Banding',
    categoryAr: 'شريط حواف PVC',
  },
  {
    id: 'agt',
    name: 'AGT',
    logo: '/images/brands/agt.webp',
    url: 'https://www.agt.com.tr/',
    category: 'MDF / Panel',
    categoryEn: 'MDF / Panel',
    categoryAr: 'MDF / ألواح',
    width: 426,
    height: 167,
  },
];

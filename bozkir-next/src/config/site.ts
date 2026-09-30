export const siteConfig = {
  name: 'Bozkır Ağaç Ürünleri',
  legalName: 'Bozkır Ağaç Ürünleri',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bozkiragac.com',
  description:
    'Mobilya ve iç mekân üreticileri için MDF lam, lake panel, suntalam, sunta, MDF ve tamamlayıcı panel çözümleri. Antakya / Hatay.',
  phone: '+90 535 527 16 12',
  phoneHref: 'tel:+905355271612',
  phone2: '+90 533 625 48 04',
  whatsapp: 'https://wa.me/905355271612',
  email: 'info@bozkiragac.com',
  address: {
    street: 'Güzelburç Mah, Yunus Emre Cad No:10/C',
    locality: 'Antakya',
    region: 'Hatay',
    postalCode: '31030',
    country: 'TR',
  },
  warehouse: {
    address: '',
    coords: '36.250556,36.181472',
  },
  hours: 'Pazartesi – Cuma: 08:00 – 18:00 · Cumartesi: 08:00 – 14:00',
  hoursEn: 'Monday – Friday: 08:00 – 18:00 · Saturday: 08:00 – 14:00',
  hoursAr: 'الاثنين – الجمعة: 08:00 – 18:00 · السبت: 08:00 – 14:00',
  social: {
    facebook: 'https://www.facebook.com/bozkiragac/',
    instagram: 'https://www.instagram.com/bozkiragac/',
  },
  nav: [
    { label: 'Ürünler', href: '/urunler', key: 'products' },
    { label: 'Koleksiyonlar', href: '/kategoriler', key: 'collections' },
    { label: 'Kataloglar', href: '/katalog', key: 'catalogs' },
    { label: 'Hakkımızda', href: '/hakkimizda', key: 'about' },
    { label: 'İletişim', href: '/iletisim', key: 'contact' },
  ],
} as const;

export type NavKey = (typeof siteConfig.nav)[number]['key'];

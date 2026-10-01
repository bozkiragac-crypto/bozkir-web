import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Bozkır Ağaç Ürünleri',
    short_name: 'Bozkır Ağaç',
    description:
      'MDF lam, lake panel, suntalam, sunta ve tamamlayıcı panel çözümleri. Antakya / Hatay.',
    start_url: '/tr',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f7f5',
    theme_color: '#f7f7f5',
    lang: 'tr',
    dir: 'ltr',
    categories: ['business', 'shopping'],
    display_override: ['standalone', 'minimal-ui'],
    shortcuts: [
      { name: 'Ürünler', url: '/tr/urunler' },
      { name: 'Teklif Al', url: '/tr/teklif-al' },
      { name: 'İletişim', url: '/tr/iletisim' },
    ],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bozkır Ağaç Ürünleri',
    short_name: 'Bozkır Ağaç',
    description:
      'MDF lam, lake panel, suntalam, sunta ve tamamlayıcı panel çözümleri. Antakya / Hatay.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f7f5',
    theme_color: '#111111',
    lang: 'tr',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

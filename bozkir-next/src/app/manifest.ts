import type { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { dictForRequest } from '@/i18n/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let settings: Awaited<ReturnType<typeof getSiteSettings>> | null = null;
  try {
    settings = await getSiteSettings();
  } catch {
    settings = null;
  }

  const brandName = settings?.identity.brandName || 'Bozkır Ağaç Ürünleri';
  const description =
    settings?.identity.description ||
    'MDF lam, lake panel, suntalam, sunta ve tamamlayıcı panel çözümleri. Antakya / Hatay.';
  const favicon = settings?.identity.favicon || '';
  const iconType = favicon.endsWith('.ico')
    ? 'image/x-icon'
    : favicon.endsWith('.svg')
      ? 'image/svg+xml'
      : 'image/png';
  const nav = (await dictForRequest('tr')).nav;

  return {
    id: '/',
    name: brandName,
    short_name: brandName,
    description,
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
      { name: nav.products, url: '/tr/urunler' },
      { name: nav.quote, url: '/tr/teklif-al' },
      { name: nav.contact, url: '/tr/iletisim' },
    ],
    icons: [
      ...(favicon && favicon !== '/favicon.ico'
        ? [{ src: favicon, sizes: 'any', type: iconType, purpose: 'any' as const }]
        : []),
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

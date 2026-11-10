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
  // Ana ekran kısayolunda uzun marka adı kesilmesin.
  const shortName = brandName.split(/\s+/).slice(0, 2).join(' ') || brandName;
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
    short_name: shortName,
    description,
    // Kök URL, ziyaretçinin dil çerezine göre /tr, /en veya /ar'a yönlenir.
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f7f5',
    theme_color: '#f7f7f5',
    lang: 'tr',
    dir: 'ltr',
    categories: ['business', 'shopping'],
    display_override: ['standalone', 'minimal-ui'],
    prefer_related_applications: false,
    // Dil öneki yok: açılışta çerez/Accept-Language ile doğru dile yönlenir.
    shortcuts: [
      { name: nav.products, url: '/urunler' },
      { name: nav.quote, url: '/teklif-al' },
      { name: nav.contact, url: '/iletisim' },
    ],
    icons: [
      ...(favicon && favicon !== '/favicon.ico'
        ? [{ src: favicon, sizes: 'any', type: iconType, purpose: 'any' as const }]
        : []),
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Maskable ikon opak zeminli ve güvenli alan içinde üretilir.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

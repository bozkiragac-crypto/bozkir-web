import { ImageResponse } from 'next/og';
import { getCategoryBySlug } from '@/lib/api/categories';
import { getDictionary } from '@/i18n/dictionaries';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';
export const alt = 'Bozkır Ağaç Ürünleri';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Uzak görseli data URL'e çevirir (ImageResponse güvenilirliği için). */
async function toDataUrl(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:')) return url || null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : 'tr';
  const dict = getDictionary(locale);
  const category = await getCategoryBySlug(slug, locale);

  const cover = await toDataUrl(category?.heroImage ?? category?.thumbnail ?? '');
  const name = category?.name ?? dict.meta.brand;
  const brand = dict.meta.brand;
  const count = category?.productCount ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#111',
          fontFamily: 'sans-serif',
        }}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,10,12,0.35) 0%, rgba(10,10,12,0.55) 45%, rgba(10,10,12,0.92) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '60px 70px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#fff',
          }}
        >
          <span style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
            {brand}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 74, fontWeight: 600, lineHeight: 1.05, maxWidth: 1000 }}>{name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 }}>
              {count > 0 && (
                <span
                  style={{
                    fontSize: 24,
                    padding: '8px 18px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {count} {dict.catalog.title.toLocaleLowerCase(locale)}
                </span>
              )}
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>bozkiragac.com</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchProductsBySlugs } from '@/lib/data/catalog';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';

/** Bir listedeki ürünleri (favoriler/karşılaştırma/son görülenler) tek istekte çözer. */
const MAX_SLUGS = 24;

const querySchema = z.object({
  slugs: z.string().min(1).max(4000),
  locale: z.string().max(5).optional(),
});

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    slugs: sp.get('slugs') ?? '',
    locale: sp.get('locale') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  const slugs = [
    ...new Set(
      parsed.data.slugs
        .split(',')
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_SLUGS);
  if (slugs.length === 0) return NextResponse.json({ items: [] });

  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : undefined;
  const items = await fetchProductsBySlugs(slugs, locale);
  return NextResponse.json(
    { items },
    {
      headers: {
        'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}

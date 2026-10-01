import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchProducts } from '@/lib/data/catalog';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';

const querySchema = z.object({
  category: z.string().max(80).optional(),
  q: z.string().max(120).optional(),
  sort: z.enum(['newest', 'name-asc', 'name-desc', 'code-asc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  locale: z.string().max(5).optional(),
});

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    category: sp.get('category') ?? undefined,
    q: sp.get('q') ?? undefined,
    sort: sp.get('sort') ?? undefined,
    limit: sp.get('limit') ?? undefined,
    offset: sp.get('offset') ?? undefined,
    locale: sp.get('locale') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz parametre' }, { status: 400 });
  }
  const { category, q, sort, limit, offset, locale: localeParam } = parsed.data;
  const locale = isLocale(localeParam) ? localeParam : undefined;

  const result = await fetchProducts({ category, query: q, sort, limit, offset }, locale);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=600' },
  });
}

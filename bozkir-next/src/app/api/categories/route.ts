import { NextResponse } from 'next/server';
import { fetchCategories } from '@/lib/data/catalog';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const localeParam = new URL(request.url).searchParams.get('locale') ?? undefined;
  const locale = isLocale(localeParam) ? localeParam : undefined;
  const categories = await fetchCategories(locale);
  return NextResponse.json(
    categories.map((c) => ({ id: c.slug, slug: c.slug, name: c.name, count: c.productCount ?? 0 })),
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}

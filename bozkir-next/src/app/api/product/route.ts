import { NextResponse } from 'next/server';
import { fetchProductBySlug } from '@/lib/data/catalog';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const slug = sp.get('slug') ?? '';
  if (!slug) return NextResponse.json({ error: 'slug parametresi gerekli' }, { status: 400 });

  const localeParam = sp.get('locale') ?? undefined;
  const locale = isLocale(localeParam) ? localeParam : undefined;
  const product = await fetchProductBySlug(slug, locale);
  if (!product) return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });

  return NextResponse.json(product, { headers: { 'Cache-Control': 'public, max-age=300' } });
}

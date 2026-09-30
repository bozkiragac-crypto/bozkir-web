import { NextResponse } from 'next/server';
import { fetchContentBlocks } from '@/lib/data/content';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const localeParam = new URL(request.url).searchParams.get('locale') ?? undefined;
  const locale = isLocale(localeParam) ? localeParam : undefined;
  const blocks = await fetchContentBlocks(locale);
  return NextResponse.json(blocks, { headers: { 'Cache-Control': 'public, max-age=300' } });
}

import { NextResponse } from 'next/server';
import { getCatalogs } from '@/lib/api/catalogs';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const localeParam = new URL(request.url).searchParams.get('locale') ?? undefined;
  const locale = isLocale(localeParam) ? localeParam : undefined;
  const catalogs = await getCatalogs(locale);
  return NextResponse.json(catalogs, { headers: { 'Cache-Control': 'public, max-age=300' } });
}

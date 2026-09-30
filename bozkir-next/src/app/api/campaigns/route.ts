import { NextResponse } from 'next/server';
import { fetchCampaigns } from '@/lib/data/campaigns';
import { isLocale } from '@/i18n/config';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const localeParam = new URL(request.url).searchParams.get('locale') ?? undefined;
  const locale = isLocale(localeParam) ? localeParam : undefined;
  const campaigns = await fetchCampaigns(locale);
  return NextResponse.json(campaigns, { headers: { 'Cache-Control': 'public, max-age=120' } });
}

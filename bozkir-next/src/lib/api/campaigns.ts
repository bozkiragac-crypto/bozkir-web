import type { Campaign } from '@/types/campaign';
import { fetchCampaigns } from '@/lib/data/campaigns';
import { apiGet, hasRemoteApi } from './client';
import type { Locale } from '@/i18n/config';

/** Anasayfadaki kayar kampanya vitrini için aktif kampanyalar. */
export async function getActiveCampaigns(locale?: Locale): Promise<Campaign[]> {
  if (!hasRemoteApi()) {
    return fetchCampaigns(locale);
  }
  try {
    const query = locale ? `?locale=${locale}` : '';
    const data = await apiGet<Campaign[]>(`/campaigns${query}`, { revalidate: 300 });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

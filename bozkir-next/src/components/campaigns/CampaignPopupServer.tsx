import { getActiveCampaigns } from '@/lib/api/campaigns';
import { getSiteSettings } from '@/lib/data/settings';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';
import { CampaignPopup } from './CampaignPopup';

/** Popup aktifse seçili (veya ilk) kampanyayı gösterir; değilse hiç çıktı vermez. */
export async function CampaignPopupServer({ locale }: { locale: Locale }) {
  let enabled = false;
  let campaignId = '';
  try {
    const s = await getSiteSettings();
    enabled = s.popupEnabled;
    campaignId = s.popupCampaignId;
  } catch {
    return null;
  }
  if (!enabled) return null;

  const campaigns = await getActiveCampaigns(locale);
  if (campaigns.length === 0) return null;
  const chosen = campaigns.find((c) => c.id === campaignId) ?? campaigns[0]!;

  return (
    <CampaignPopup
      readMore={dictFor(locale).home.campaign.readMore}
      campaign={{
        id: chosen.id,
        title: chosen.title,
        description: chosen.description,
        imageUrl: chosen.imageUrl,
        linkUrl: chosen.linkUrl,
        linkLabel: chosen.linkLabel,
      }}
    />
  );
}

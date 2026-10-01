declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type AnalyticsEvent =
  | 'product_view'
  | 'catalog_view'
  | 'catalog_download'
  | 'quote_start'
  | 'quote_submit'
  | 'contact_submit'
  | 'search'
  | 'filter_used'
  | 'project_view'
  | 'cta_click'
  | 'favorite_add'
  | 'favorite_remove'
  | 'compare_add'
  | 'compare_remove'
  | 'share'
  | 'whatsapp_click'
  | 'phone_click';

const CONSENT_KEY = 'bozkir:consent';

/** Çerez onayı verilmiş mi? (analytics çerezleri) */
function consentGranted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  } catch {
    return false;
  }
}

/**
 * Merkezi analytics yardımcı katmanı. Bileşenler doğrudan gtag çağırmaz.
 * NEXT_PUBLIC_ANALYTICS_ID yoksa veya çerez onayı verilmemişse hiçbir veri gönderilmez.
 */
export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, params);
  }
  if (!consentGranted()) return;
  window.gtag?.('event', event, params);
}

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
  | 'whatsapp_click';

/**
 * Merkezi analytics yardımcı katmanı. Bileşenler doğrudan gtag çağırmaz.
 * NEXT_PUBLIC_ANALYTICS_ID yoksa hiçbir veri gönderilmez.
 */
export function track(event: AnalyticsEvent, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, params);
  }
  window.gtag?.('event', event, params);
}

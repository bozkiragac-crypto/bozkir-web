import { getSiteSettings } from '@/lib/data/settings';

export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
}

/**
 * Genel webhook gönderimi. `site_settings.webhookUrl` tanımlıysa JSON POST atar.
 * Hata olsa bile akışı bozmaz (bildirim kaybı talebi engellemez).
 */
export async function sendWebhook(event: string, data: Record<string, unknown>): Promise<void> {
  let url = '';
  try {
    const s = await getSiteSettings();
    url = s.webhookUrl?.trim() ?? '';
  } catch {
    return;
  }
  if (!url || !/^https?:\/\//i.test(url)) return;

  const payload: WebhookEvent = { event, data };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ts: new Date().toISOString() }),
      signal: controller.signal,
    });
  } catch {
    // yok say (ağ hatası/timeout)
  } finally {
    clearTimeout(timer);
  }
}

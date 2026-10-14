import { createHmac } from 'node:crypto';
import { getSiteSettings } from '@/lib/data/settings';

export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
}

/** Özel/ayrılmış adresleri (SSRF guard) reddeder. */
function isDisallowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true;
  if (h === 'metadata.google.internal') return true;
  if (h.includes(':')) return true; // IPv6 literal — güvenli değil, geç
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

/**
 * Genel webhook gönderimi. `site_settings.webhookUrl` tanımlıysa JSON POST atar.
 * Hata olsa bile akışı bozmaz (bildirim kaybı talebi engellemez).
 * WEBHOOK_SECRET tanımlıysa `X-Bozkir-Signature` (HMAC-SHA256) eklenir.
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

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (isDisallowedHost(parsed.hostname)) return;

  const payload: WebhookEvent = { event, data };
  const body = JSON.stringify({ ...payload, ts: new Date().toISOString() });
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    headers['X-Bozkir-Signature'] =
      `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(url, { method: 'POST', headers, body, signal: controller.signal });
  } catch {
    // yok say (ağ hatası/timeout)
  } finally {
    clearTimeout(timer);
  }
}

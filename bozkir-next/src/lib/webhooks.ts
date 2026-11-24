import { createHmac } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getSiteSettings } from '@/lib/data/settings';

export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
}

/** Özel/ayrılmış IPv4/IPv6 adreslerini reddeder (SSRF guard). */
export function isDisallowedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / metadata
    if (a === 172 && b! >= 16 && b! <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a! >= 224) return true; // multicast / reserved
    return false;
  }
  if (version === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::') return true;
    if (v.startsWith('fc') || v.startsWith('fd')) return true; // unique local
    if (v.startsWith('fe80')) return true; // link-local
    const mapped = /::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    if (mapped) return isDisallowedIp(mapped[1]!);
    return false;
  }
  return false;
}

/** Özel/ayrılmış adresleri (SSRF guard) reddeder. */
export function isDisallowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true;
  if (h === 'metadata.google.internal') return true;
  if (/^\d+$/.test(h)) return true; // ondalık tam sayı IP (ör. 2130706433) — reddet
  if (isIP(h)) return isDisallowedIp(h);
  return false;
}

function webhookUrlAllowed(parsed: URL): boolean {
  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  if (isDisallowedHost(parsed.hostname)) return false;
  return true;
}

async function resolvesToDisallowedIp(hostname: string): Promise<boolean> {
  if (isIP(hostname) !== 0) return isDisallowedIp(hostname);
  try {
    const addrs = await Promise.race([
      lookup(hostname, { all: true, verbatim: true }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('dns timeout')), 3000)),
    ]);
    if (addrs.length === 0) return true;
    return addrs.some((a) => isDisallowedIp(a.address));
  } catch {
    return true;
  }
}

/** Webhook URL'sini kayıt/teslim öncesi doğrular. */
export async function validateWebhookUrl(value: string): Promise<string | null> {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'Webhook URL geçersiz.';
  }
  if (!webhookUrlAllowed(parsed)) {
    return 'Webhook URL yalnızca herkese açık bir https:// adresi olmalıdır.';
  }
  if (await resolvesToDisallowedIp(parsed.hostname)) {
    return 'Webhook URL iç/ağ adresine çözümleniyor; güvenlik nedeniyle reddedildi.';
  }
  return null;
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
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (!webhookUrlAllowed(parsed)) return;
  if (await resolvesToDisallowedIp(parsed.hostname)) return;

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
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      redirect: 'error',
      signal: controller.signal,
    });
    void res.arrayBuffer().catch(() => undefined);
  } catch {
    // yok say (ağ hatası/timeout/redirect)
  } finally {
    clearTimeout(timer);
  }
}

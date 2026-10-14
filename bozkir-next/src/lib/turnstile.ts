/**
 * Cloudflare Turnstile doğrulaması.
 *
 * `TURNSTILE_SECRET_KEY` tanımlı değilse doğrulama atlanır (yerel geliştirme,
 * E2E ve LAN senaryoları). Production'da anahtarlar tanımlanınca zorunlu olur.
 *
 * Hata politikası: açık ağ hatasında (Cloudflare'e ulaşılamıyor) fail-open —
 * gerçek müşteri talebi kaybolmasın. Cloudflare'in döndürdüğü `success:false`
 * ise kesin reddedilir.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token) return false;
  // Ağ/HTTP hatasında varsayılan fail-open; TURNSTILE_FAIL_CLOSED=1 ile fail-closed.
  const failClosed = process.env.TURNSTILE_FAIL_CLOSED === '1';

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== 'unknown' && ip !== 'local') body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return !failClosed; // Cloudflare hatası
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (e) {
    console.error('[turnstile] doğrulama hatası:', e instanceof Error ? e.message : e);
    return !failClosed; // ağ/timeout
  }
}

import { cookies, headers } from 'next/headers';
import { AUTH_COOKIE, signSessionToken, verifySessionToken, type SessionPayload } from './token';

/**
 * Oturum çerezi `Secure` olmalı mı?
 *
 * `NODE_ENV` tek başına yeterli değil: production derlemesi LAN üzerinden
 * `http://192.168.x.x` ile de açılabiliyor ve tarayıcılar `Secure` çerezi
 * yalnızca güvenilir kaynaklarda (https veya http://localhost) saklıyor.
 * Aksi halde çerez sessizce atılır ve telefondan giriş yapılamıyor.
 *
 * Karar gerçek şemaya göre verilir: nginx tüm proxy konumlarında
 * `X-Forwarded-Proto $scheme` gönderiyor, dolayısıyla üretimde HTTPS'te
 * `Secure` yine açık kalır. Başlık yoksa (doğrudan 3000 portu) host'a bakılır.
 * Acil çıkış için `AUTH_COOKIE_SECURE=1|0` ile elle ezilebilir.
 */
export function resolveSecure(forwardedProto: string | null, hostname: string): boolean {
  const override = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (override === '1' || override === 'true') return true;
  if (override === '0' || override === 'false') return false;

  const proto = (forwardedProto ?? '').split(',')[0]?.trim().toLowerCase();
  if (proto === 'https') return true;
  if (proto === 'http') return false;

  // Başlık yok: localhost güvenli kaynak sayıldığı için HTTP'de çalışır,
  // diğer hostlarda production HTTPS varsayılır.
  const host = hostname.toLowerCase().replace(/:\d+$/, '');
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  return process.env.NODE_ENV === 'production';
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  const h = await headers();
  const secure = resolveSecure(h.get('x-forwarded-proto'), h.get('x-forwarded-host') ?? h.get('host') ?? '');
  // "Session cookie": maxAge/expires verilmez → tarayıcı kapanınca silinir,
  // böylece site/tarayıcı yeniden açıldığında tekrar giriş istenir.
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(AUTH_COOKIE)?.value);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

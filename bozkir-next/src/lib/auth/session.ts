import { cookies } from 'next/headers';
import { AUTH_COOKIE, signSessionToken, verifySessionToken, type SessionPayload } from './token';

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  // "Session cookie": maxAge/expires verilmez → tarayıcı kapanınca silinir,
  // böylece site/tarayıcı yeniden açıldığında tekrar giriş istenir.
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
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

import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE = 'bozkir_admin';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 gün

export interface SessionPayload {
  sub: string;
  username: string;
  email?: string;
  name: string;
  role: string;
  admin: true;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? '';
  if (!secret) throw new Error('AUTH_SECRET tanımlı değil.');
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.admin !== true) return null;
    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) return null;
    return {
      sub,
      username: typeof payload.username === 'string' ? payload.username : '',
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : '',
      role: typeof payload.role === 'string' ? payload.role : 'owner',
      admin: true,
    };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;

import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE = 'bozkir_admin';
// Tarayıcı açık kalsa bile bu süre sonunda yeniden giriş gerekir (12 saat).
const MAX_AGE_SECONDS = 60 * 60 * 12;
const TOKEN_ISSUER = 'bozkir-admin';
const TOKEN_AUDIENCE = 'bozkir-admin';
const MIN_SECRET_LENGTH = 16;

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
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET en az ${MIN_SECRET_LENGTH} karakter olmalı.`);
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ['HS256'],
    });
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

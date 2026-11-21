import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE = 'bozkir_admin';
// Taray?c? a??k kalsa bile bu s?re sonunda yeniden giri? gerekir (12 saat).
const MAX_AGE_SECONDS = 60 * 60 * 12;
const TOKEN_ISSUER = 'bozkir-admin';
const TOKEN_AUDIENCE = 'bozkir-admin';
const MIN_SECRET_LENGTH = 32;
const DEV_MIN_SECRET_LENGTH = 16;
const WEAK_SECRETS = new Set([
  'change-me',
  'changeme',
  'secret',
  'password',
  'auth_secret',
  'auth-secret',
  'your-secret-here',
  'replace-me',
  'default',
  'test',
  'development',
  'bozkir',
  'admin',
]);

export interface SessionPayload {
  sub: string;
  username: string;
  email?: string;
  name: string;
  role: string;
  admin: true;
}

function isWeakSecret(secret: string): boolean {
  const normalized = secret.trim().toLowerCase();
  if (!normalized) return true;
  if (WEAK_SECRETS.has(normalized)) return true;
  // Ayn? karakterin tekrar? veya ?ok d???k ?e?itlilik
  if (/^(.)\1+$/.test(secret)) return true;
  return false;
}

function getSecret(): Uint8Array {
  const secret = (process.env.AUTH_SECRET ?? '').trim();
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProd) {
      throw new Error('AUTH_SECRET production ortam?nda tan?ml? ve g??l? olmal?d?r.');
    }
    throw new Error('AUTH_SECRET tan?ml? de?il.');
  }

  if (isWeakSecret(secret)) {
    if (isProd) {
      throw new Error(
        'AUTH_SECRET zay?f veya varsay?lan bir de?er; production i?in rastgele ve g??l? bir de?er kullan?n.',
      );
    }
    console.warn(
      '[auth] AUTH_SECRET zay?f g?r?n?yor; production i?in rastgele ve g??l? bir de?er kullan?n.',
    );
  }

  const minLength = isProd ? MIN_SECRET_LENGTH : DEV_MIN_SECRET_LENGTH;
  if (secret.length < minLength) {
    throw new Error(`AUTH_SECRET en az ${minLength} karakter olmal?.`);
  }

  if (!isProd && secret.length < MIN_SECRET_LENGTH) {
    console.warn(`[auth] AUTH_SECRET en az ${MIN_SECRET_LENGTH} karakter olmal?d?r (production gereksinimi).`);
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

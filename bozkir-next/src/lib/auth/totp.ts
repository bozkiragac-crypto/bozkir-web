import { generateSecret, generateURI, verify } from 'otplib';

const ISSUER = 'Bozkır Ağaç Admin';

/** Yeni bir TOTP secret üretir. */
export function createTotpSecret(): string {
  return generateSecret();
}

/** Authenticator uygulaması için otpauth:// URI üretir. */
export function totpKeyUri(account: string, secret: string): string {
  return generateURI({ secret, label: account, issuer: ISSUER });
}

/** 6 haneli kodu doğrular (saat kaymasına toleranslı). */
export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const clean = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    const res = await verify({ secret, token: clean, epochTolerance: 30 });
    // v13: { valid: boolean, ... } döner.
    if (typeof res === 'object' && res !== null && 'valid' in res) {
      return (res as { valid: boolean }).valid === true;
    }
    return res === true;
  } catch {
    return false;
  }
}

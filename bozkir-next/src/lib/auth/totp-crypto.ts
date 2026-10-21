import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const PREFIX = 'v1:';
const ALGO = 'aes-256-gcm';

/**
 * 2FA secret'larını DB'de şifreler. Anahtar önceliği:
 *   1) TOTP_ENCRYPTION_KEY (base64 veya 64 karakter hex, 32 byte)
 *   2) AUTH_SECRET'tan türetilmiş SHA-256 (geriye uyumluluk)
 *
 * AUTH_SECRET döndürülürse mevcut TOTP secret'ları okunamaz; üretimde ayrı
 * TOTP_ENCRYPTION_KEY kullanın ve parola yöneticisinde saklayın.
 */
function encryptionKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (raw) {
    const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error('TOTP_ENCRYPTION_KEY 32 byte olmalı (base64 veya 64 karakter hex).');
    }
    return key;
  }
  const authSecret = process.env.AUTH_SECRET?.trim();
  if (!authSecret) {
    throw new Error('TOTP_ENCRYPTION_KEY veya AUTH_SECRET tanımlı olmalı.');
  }
  return createHash('sha256').update(authSecret).digest();
}

export function isEncryptedTotpSecret(value: string | null | undefined): boolean {
  return !!value?.startsWith(PREFIX);
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/** Eski düz metin kayıtları da okunur (kademeli migrasyon). */
export function decryptTotpSecret(value: string): string {
  if (!value) return '';
  if (!isEncryptedTotpSecret(value)) return value;
  const parts = value.slice(PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('Geçersiz TOTP secret formatı.');
  const [ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivB64!, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64!, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64!, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

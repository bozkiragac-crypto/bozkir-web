import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  decryptTotpSecret,
  encryptTotpSecret,
  isEncryptedTotpSecret,
} from '@/lib/auth/totp-crypto';

const originalKey = process.env.TOTP_ENCRYPTION_KEY;

describe('totp-crypto', () => {
  beforeAll(() => {
    process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  });
  afterAll(() => {
    if (originalKey === undefined) delete process.env.TOTP_ENCRYPTION_KEY;
    else process.env.TOTP_ENCRYPTION_KEY = originalKey;
  });

  it('secret’ı şifreler ve geri çözer', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptTotpSecret(secret);
    expect(isEncryptedTotpSecret(encrypted)).toBe(true);
    expect(encrypted).not.toContain(secret);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  it('eski düz metin kayıtları okumaya devam eder', () => {
    expect(decryptTotpSecret('JBSWY3DPEHPK3PXP')).toBe('JBSWY3DPEHPK3PXP');
    expect(isEncryptedTotpSecret('JBSWY3DPEHPK3PXP')).toBe(false);
  });

  it('bozulmuş ciphertext’i reddeder', () => {
    const encrypted = encryptTotpSecret('JBSWY3DPEHPK3PXP');
    const tampered = `${encrypted.slice(0, -2)}AA`;
    expect(() => decryptTotpSecret(tampered)).toThrow();
  });
});

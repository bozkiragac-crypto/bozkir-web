import { describe, it, expect } from 'vitest';
import { generate } from 'otplib';
import { createTotpSecret, totpKeyUri, verifyTotp } from '@/lib/auth/totp';

describe('totp', () => {
  it('secret üretir (base32, yeterli uzunluk)', () => {
    const s = createTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]+=*$/);
    expect(s.length).toBeGreaterThanOrEqual(16);
  });

  it('otpauth URI doğru biçimde üretilir', () => {
    const s = createTotpSecret();
    const uri = totpKeyUri('bozkir', s);
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain(encodeURIComponent(s));
  });

  it('geçerli kodu doğrular, geçersizi reddeder', async () => {
    const s = createTotpSecret();
    const token = await generate({ secret: s });
    expect(await verifyTotp(s, token)).toBe(true);
    // Gerçek koddan farklı bir kod üret (ör. her haneyi 9'dan çıkar).
    const wrong = token
      .split('')
      .map((d) => String(9 - Number(d)))
      .join('');
    expect(await verifyTotp(s, wrong)).toBe(false);
    expect(await verifyTotp(s, 'abc')).toBe(false);
    expect(await verifyTotp(s, '')).toBe(false);
  });

  it('boşluklu kodu kabul eder (normalize)', async () => {
    const s = createTotpSecret();
    const token = await generate({ secret: s });
    const spaced = `${token.slice(0, 3)} ${token.slice(3)}`;
    expect(await verifyTotp(s, spaced)).toBe(true);
  });
});

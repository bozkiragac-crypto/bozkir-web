import { describe, expect, it } from 'vitest';
import { pickClientIp } from '@/lib/ratelimit';
import { sanitizeHeader } from '@/lib/mailer';

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe('pickClientIp (XFF spoof koruması)', () => {
  it('x-real-ip varsa onu kullanır (XFF sahte olsa bile)', () => {
    const h = headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.2.3.4' });
    expect(pickClientIp(h, true)).toBe('203.0.113.7');
  });

  it('XFF zincirinde en sağdaki geçerli IP gerçek istemcidir', () => {
    const h = headers({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' });
    expect(pickClientIp(h, true)).toBe('203.0.113.9');
  });

  it('geçersiz XFF değerlerini atlar', () => {
    const h = headers({ 'x-forwarded-for': 'salak, 999.1.1.1, 198.51.100.4' });
    expect(pickClientIp(h, true)).toBe('198.51.100.4');
  });

  it('IPv6 kabul eder', () => {
    const h = headers({ 'x-real-ip': '2001:db8::1' });
    expect(pickClientIp(h, true)).toBe('2001:db8::1');
  });

  it('hiçbir geçerli değer yoksa unknown döner', () => {
    const h = headers({ 'x-forwarded-for': 'salak' });
    expect(pickClientIp(h, true)).toBe('unknown');
  });

  it('güvenilmeyen proxy modunda başlıkları yok sayar', () => {
    const h = headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.2.3.4' });
    expect(pickClientIp(h, false)).toBe('unknown');
  });
});

describe('sanitizeHeader (e-posta başlık enjeksiyonu)', () => {
  it('CR/LF ve kontrol karakterlerini temizler', () => {
    expect(sanitizeHeader('Ali\r\nBcc: attacker@example.com')).toBe('Ali Bcc: attacker@example.com');
    expect(sanitizeHeader('Ali\nX-Evil: 1')).toBe('Ali X-Evil: 1');
    expect(sanitizeHeader('a\u0000b')).toBe('a b');
  });

  it('boş/undefined güvenli döner', () => {
    expect(sanitizeHeader(undefined)).toBe('');
    expect(sanitizeHeader('  ')).toBe('');
  });
});

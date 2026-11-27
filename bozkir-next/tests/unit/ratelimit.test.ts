import { describe, it, expect } from 'vitest';
import { isRateLimited, resetRateLimit, RATE_WINDOW_SECONDS } from '@/lib/ratelimit';

describe('ratelimit', () => {
  it('limit altında izin verir, aşınca engeller', () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(isRateLimited(key, 3)).toBe(false);
    expect(isRateLimited(key, 3)).toBe(true);
  });

  it('max<=0 devre dışı', () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 100; i++) expect(isRateLimited(key, 0)).toBe(false);
  });

  it('farklı anahtarlar bağımsız', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(isRateLimited(a, 1)).toBe(false);
    expect(isRateLimited(a, 1)).toBe(true);
    expect(isRateLimited(b, 1)).toBe(false);
  });

  it('reset sonrası sayaç sıfırdan başlar', () => {
    const key = `reset-${Math.random()}`;
    expect(isRateLimited(key, 1)).toBe(false);
    expect(isRateLimited(key, 1)).toBe(true);
    resetRateLimit(key);
    expect(isRateLimited(key, 1)).toBe(false);
  });

  it('pencere süresi saniye olarak okunabilir', () => {
    expect(RATE_WINDOW_SECONDS).toBeGreaterThan(0);
  });
});

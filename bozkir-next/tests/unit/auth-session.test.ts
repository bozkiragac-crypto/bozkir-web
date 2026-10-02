import { describe, it, expect, afterEach } from 'vitest';
import { resolveSecure } from '@/lib/auth/session';

/**
 * Oturum çerezi `Secure` kararı.
 *
 * Tarayıcılar `Secure` çerezi yalnızca güvenilir kaynaklarda saklar
 * (https veya http://localhost). Bu yüzden production derlemesi LAN üzerinden
 * `http://192.168.x.x` ile açıldığında çerez atılır ve giriş yapılamaz.
 */
describe('resolveSecure', () => {
  const original = process.env.AUTH_COOKIE_SECURE;
  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_COOKIE_SECURE;
    else process.env.AUTH_COOKIE_SECURE = original;
  });

  it('nginx https iletiyorsa Secure açar', () => {
    expect(resolveSecure('https', 'bozkiragac.com')).toBe(true);
  });

  it('nginx http iletiyorsa Secure kapatır (LAN testi)', () => {
    expect(resolveSecure('http', '192.168.1.125')).toBe(false);
    expect(resolveSecure('http', 'localhost')).toBe(false);
  });

  it('virgüllü zincirde ilk değeri kullanır', () => {
    expect(resolveSecure('https,http', 'bozkiragac.com')).toBe(true);
    expect(resolveSecure('http, https', 'bozkiragac.com')).toBe(false);
  });

  it('başlık yoksa localhost güvenli sayılır (http çalışır)', () => {
    expect(resolveSecure(null, 'localhost')).toBe(false);
    expect(resolveSecure(null, 'localhost:3000')).toBe(false);
    expect(resolveSecure(null, '127.0.0.1')).toBe(false);
    expect(resolveSecure(null, '[::1]')).toBe(false);
  });

  it('başlık yoksa diğer hostlar production varsayımına düşer', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const setNodeEnv = (v: string) => {
      (process.env as Record<string, string | undefined>).NODE_ENV = v;
    };

    setNodeEnv('production');
    expect(resolveSecure(null, '192.168.1.125')).toBe(true);
    expect(resolveSecure(null, 'bozkiragac.com')).toBe(true);

    setNodeEnv('development');
    expect(resolveSecure(null, 'bozkiragac.com')).toBe(false);
    setNodeEnv(prevNodeEnv ?? 'production');
  });

  it('ortam değişkeni kararı ezer', () => {
    process.env.AUTH_COOKIE_SECURE = '0';
    expect(resolveSecure('https', 'bozkiragac.com')).toBe(false);

    process.env.AUTH_COOKIE_SECURE = '1';
    expect(resolveSecure('http', '192.168.1.125')).toBe(true);
  });
});

describe('admin sekme toleransı', () => {
  it('grace penceresi makul bir süre', () => {
    return import('@/lib/admin/session-keys').then(({ ADMIN_GRACE_MS }) => {
      // Çok kısa → mobilde her sekme atılışında düşer.
      expect(ADMIN_GRACE_MS).toBeGreaterThanOrEqual(15 * 60 * 1000);
      // Çok uzun → oturum açık kalır, "her seferinde giriş" hedefini bozar.
      expect(ADMIN_GRACE_MS).toBeLessThanOrEqual(2 * 60 * 60 * 1000);
    });
  });
});
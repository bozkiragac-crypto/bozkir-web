import { test, expect, requestGetWithConnectionRetry, requestGetWithRetry } from './fixtures';

/**
 * Herkese açık HTML sayfaları nginx'te kısa süreli cache'e alınır.
 * Eşsiz sorgu parametresi cache key'ini izole eder; böylece test önceki
 * isteklerden etkilenmez.
 */
test('herkese açık sayfa ikinci istekte nginx cache’den gelir', async ({ request }) => {
  const url = `/tr?cache_probe=${Date.now()}`;

  const first = await requestGetWithRetry(request, url);
  expect(first.status()).toBe(200);
  expect(first.headers()['x-cache-status']).toBe('MISS');
  expect(first.headers()['cache-control']).toContain('max-age=30');

  const second = await requestGetWithRetry(request, url);
  expect(second.status()).toBe(200);
  expect(second.headers()['x-cache-status']).toBe('HIT');
});

test('admin yolları nginx cache’i bypass eder', async ({ request }) => {
  const url = `/admin/login?cache_probe=${Date.now()}`;

  for (let i = 0; i < 2; i++) {
    const res = await requestGetWithRetry(request, url);
    expect(res.status()).toBe(200);
    expect(res.headers()['x-cache-status']).not.toBe('HIT');
  }
});

test('RSC prefetch istekleri 503 üretmez', async ({ request }) => {
  // Gerçek prefetch: aynı `_rsc` token'ı ile bir sayfadaki birçok bağlantıya paralel istek.
  const token = `burst-${Date.now()}`;
  const paths = [
    '/tr',
    '/tr/urunler',
    '/tr/kategoriler',
    '/tr/hakkimizda',
    '/tr/iletisim',
    '/tr/katalog',
    '/tr/bayilikler',
    '/tr/sss',
    '/tr/favoriler',
    '/tr/teklif-al',
    '/tr/cerez-politikasi',
    '/tr/karsilastir',
  ];
  const responses = await Promise.all(
    Array.from({ length: 105 }, (_, i) =>
      requestGetWithConnectionRetry(request, `${paths[i % paths.length]}?_rsc=${token}`),
    ),
  );
  const statuses = responses.map((res) => res.status());

  expect(statuses).not.toContain(503);
});

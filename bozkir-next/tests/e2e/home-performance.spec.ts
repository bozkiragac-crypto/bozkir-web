import { test, expect } from './fixtures';

/**
 * Ana sayfa performans regresyonu: 3D panel kodu ilk yükte gelmemeli.
 * Chunk adları hash'lendiği için içerik imzası (WebGLRenderer) kullanılır.
 */
test('ana sayfa ilk yükte WebGL/three.js kodunu indirmez', async ({ page }) => {
  const webglChunks: string[] = [];
  const checks: Promise<void>[] = [];

  page.on('response', (response) => {
    if (!response.url().includes('/_next/static/chunks/')) return;
    if (response.request().resourceType() !== 'script') return;
    checks.push(
      (async () => {
        try {
          const body = await response.text();
          if (body.includes('WebGLRenderer')) webglChunks.push(response.url());
        } catch {
          // Gövde okunamadıysa bu isteği atla; ana iddia yine geçerli.
        }
      })(),
    );
  });

  await page.goto('/tr', { waitUntil: 'networkidle' });
  await Promise.all(checks);
  await expect(page.locator('[data-testid="panel-3d"]')).toBeVisible();

  expect(
    webglChunks,
    'WebGL kodu yalnızca kullanıcı 3D görüntüleyiciyi açtığında yüklenmeli',
  ).toEqual([]);
});

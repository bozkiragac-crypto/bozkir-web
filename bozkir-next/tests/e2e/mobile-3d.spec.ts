import { test, expect, gotoWithRetry } from './fixtures';

// Test, hangi Playwright projesinde koşarsa koşsun mobil cihazı taklit eder.
test.use({
  viewport: { width: 412, height: 915 },
  hasTouch: true,
  isMobile: true,
  serviceWorkers: 'block',
});

test('mobilde 3D bölümü önizleme olmadan satır içi açılır, sayfa kaydırması engellenmez', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await gotoWithRetry(page, '/tr');

  const panel = page.locator('[data-testid="panel-3d"]');
  await expect(panel).toBeAttached();
  await panel.scrollIntoViewIfNeeded();

  const viewer = panel.locator('[data-testid="panel-viewer"]');
  await expect(viewer).toBeVisible({ timeout: 60_000 });
  await expect(viewer.locator('canvas')).toBeVisible();

  // Statik önizleme görseli yerine 3D doğrudan görünür.
  await expect(panel.locator('img')).toHaveCount(0);

  // Tek parmakla sayfa kaydırması için dokunma yönü tarayıcıya bırakılmalı.
  await expect(viewer).toHaveCSS('touch-action', 'pan-y');
  await expect(viewer).not.toHaveAttribute('data-lenis-prevent');

  // Tam ekran özelliği küçük bir düğmeyle korunur.
  await expect(page.getByRole('button', { name: '3D olarak incele' })).toHaveCount(1);
});

test(`3D chunk yüklenirken mobilde statik görsel yerine nötr yer tutucu gösterilir`, async ({
  page,
}) => {
  test.setTimeout(90_000);
  // Hydration tamamlanmadan kaydırırsak IntersectionObserver henüz bağlı olmaz.
  await page.goto('/tr', { waitUntil: 'networkidle' });

  // Ağı yavaşlatarak 3D chunk'ını bölüme gelindikten sonra da yüklenir tutarız.
  // Route ile gövde okumak kırılgan olduğu için CDP kullanılır.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: 200 * 1024,
    uploadThroughput: 200 * 1024,
  });

  try {
    const panel = page.locator('[data-testid="panel-3d"]');
    await expect(panel).toBeAttached();
    await panel.scrollIntoViewIfNeeded();

    // Chunk hâlâ yüklenirken statik görsel değil nötr iskelet görünmeli.
    await expect(panel.locator('[data-testid="panel-skeleton"]')).toBeVisible({ timeout: 5000 });
    await expect(panel.locator('img')).toHaveCount(0);

    const viewer = panel.locator('[data-testid="panel-viewer"]');
    await expect(viewer).toBeVisible({ timeout: 60_000 });
    await expect(viewer.locator('canvas')).toBeVisible();
    await expect(panel.locator('img')).toHaveCount(0);
  } finally {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
  }
});

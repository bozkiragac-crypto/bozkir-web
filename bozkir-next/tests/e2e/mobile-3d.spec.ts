import { test, expect, gotoWithRetry } from './fixtures';

// Test, hangi Playwright projesinde koşarsa koşsun mobil cihazı taklit eder.
test.use({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });

test('mobilde 3D bölümü önizleme olmadan satır içi açılır, sayfa kaydırması engellenmez', async ({
  page,
}) => {
  await gotoWithRetry(page, '/tr');

  const panel = page.locator('[data-testid="panel-3d"]');
  await expect(panel).toBeAttached();
  await panel.scrollIntoViewIfNeeded();

  const viewer = panel.locator('[data-testid="panel-viewer"]');
  await expect(viewer).toBeVisible({ timeout: 25_000 });
  await expect(viewer.locator('canvas')).toBeVisible();

  // Statik önizleme görseli yerine 3D doğrudan görünür.
  await expect(panel.locator('img')).toHaveCount(0);

  // Tek parmakla sayfa kaydırması için dokunma yönü tarayıcıya bırakılmalı.
  await expect(viewer).toHaveCSS('touch-action', 'pan-y');
  await expect(viewer).not.toHaveAttribute('data-lenis-prevent');

  // Tam ekran özelliği küçük bir düğmeyle korunur.
  await expect(page.getByRole('button', { name: '3D olarak incele' })).toHaveCount(1);
});

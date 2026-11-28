import { type Page } from '@playwright/test';
import { test, expect, gotoWithRetry } from './fixtures';

// Lenis/GSAP kaynaklı scroll sürtünmesini elemek için hareket azaltma açık.
test.use({ reducedMotion: 'reduce' });

async function gotoFirstProduct(page: Page): Promise<void> {
  await gotoWithRetry(page, '/tr/urunler');
  const first = page.locator('main a[href*="/tr/urunler/"]').first();
  await first.waitFor({ state: 'visible' });
  const href = (await first.getAttribute('href')) ?? '';
  await gotoWithRetry(page, href);
  await expect(page).toHaveURL(/\/tr\/urunler\/.+/);
}

async function expectFixedCtaInViewport(page: Page): Promise<void> {
  const bars = page.locator('[data-product-cta]');
  // Hydration/streaming tekrarında iki çubuk birden oluşabiliyor; gerçek UI
  // hatasını `.first()` ile gizlemek yerine burada yakalıyoruz.
  await expect(bars).toHaveCount(1);
  const bar = bars.first();
  await expect(bar).toBeVisible();
  const box = await bar.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1);
}

test.describe('P1 — ürün teklif CTA yerleşimi', () => {
  test('929px: sabit CTA görünür ve kaydırma sonrası ekranda kalır', async ({ page }) => {
    await page.setViewportSize({ width: 929, height: 800 });
    await gotoFirstProduct(page);
    await expectFixedCtaInViewport(page);
    await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight / 2)));
    await expectFixedCtaInViewport(page);
  });

  test('1200px: masaüstü CTA yerinde kalır, sabit çubuk görünmez', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await gotoFirstProduct(page);
    const inline = page.locator('a[href*="teklif-al?urun="]').first();
    await expect(inline).toBeVisible();
    await expect(inline).toBeInViewport();
    await expect(page.locator('[data-product-cta]')).toBeHidden();
  });

  test('390px: sabit CTA ekranın altında görünür', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoFirstProduct(page);
    await expectFixedCtaInViewport(page);
  });
});

test.describe('P2 — ürün kartı ikon yoğunluğu', () => {
  test('mobil: tek ana eylem + diğer işlemler menüsü, 44px dokunma alanı', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoWithRetry(page, '/tr/urunler');
    const card = page.locator('[data-product-card]').first();
    await expect(card).toBeVisible();

    const favorite = card.locator('button[aria-label*="favorilere ekle" i]');
    const compare = card.locator('button[aria-label*="karşılaştırmaya ekle" i]');
    const more = card.getByRole('button', { name: /daha fazla işlem/i });

    await expect(favorite).toBeVisible();
    await expect(more).toBeVisible();
    await expect(compare).toBeHidden();

    for (const button of [favorite, more]) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    await more.click();
    await expect(compare).toBeVisible();
    const compareBox = await compare.boundingBox();
    expect(compareBox).not.toBeNull();
    expect(compareBox!.width).toBeGreaterThanOrEqual(44);
    expect(compareBox!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('P4 — tipografi, odak ve dialog etiketi', () => {
  test('PDF rozeti en az 12px', async ({ page }) => {
    await gotoWithRetry(page, '/tr');
    const badge = page.locator('[data-single-catalog] span').filter({ hasText: /^PDF$/ });
    await expect(badge).toBeVisible();
    const fontSize = await badge.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(12);
  });

  test('arama kapsayıcısı focus ile 2px halka alır', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const shell = page.locator('[data-search-shell]').first();
    await expect(shell).toBeVisible();
    await shell.locator('[data-search-input]').focus();
    const shadow = await shell.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
    expect(shadow).toContain('2px');
  });

  test('mobil menü dialogu "Menü" etiketine sahip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoWithRetry(page, '/tr');
    await page.getByRole('button', { name: 'Menüyü aç' }).click();
    await expect(page.locator('#mobile-menu')).toHaveAttribute('aria-label', 'Menü');
  });
});

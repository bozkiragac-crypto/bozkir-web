import { test, expect, gotoWithRetry } from './fixtures';

test.describe('Yeni özellikler', () => {
  test('ürün detayında "Benzer Ürünler" bölümü görünür', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const product = page.locator('main a[href*="/tr/urunler/"]').first();
    await product.waitFor({ state: 'visible' });
    const href = (await product.getAttribute('href')) ?? '';
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/tr\/urunler\/.+/);
    await expect(page.getByRole('heading', { name: 'Benzer Ürünler' })).toBeVisible();
  });

  test('SSS sayfası açılır ve FAQ şeması içerir', async ({ page }) => {
    const res = await gotoWithRetry(page, '/tr/sss');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('FAQPage'))).toBeTruthy();
  });

  test('footerda SSS bağlantısı var', async ({ page }) => {
    await gotoWithRetry(page, '/tr');
    await expect(page.locator('footer a[href$="/sss"]').first()).toHaveAttribute('href', /\/sss$/);
  });

  test('diller: /en/sss ve /ar/sss', async ({ page }) => {
    for (const p of ['/en/sss', '/ar/sss']) {
      const res = await gotoWithRetry(page, p);
      expect(res?.status(), p).toBeLessThan(400);
    }
  });
});

test.describe('Admin yeni özellikler', () => {
  test('ayarlar: 2FA, popup ve webhook alanları', async ({ adminPage }) => {
    await adminPage.goto('/admin/ayarlar');
    await expect(adminPage.getByText('İki Adımlı Doğrulama (2FA)')).toBeVisible();
    await expect(adminPage.getByText('Kampanya popup')).toBeVisible();
    await expect(adminPage.getByText('Webhook').first()).toBeVisible();
  });

  test('owner menüde Kullanıcılar/Ayarlar görünür', async ({ adminPage }) => {
    await expect(adminPage.getByRole('link', { name: 'Kullanıcılar' }).first()).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Ayarlar' }).first()).toBeVisible();
  });
});

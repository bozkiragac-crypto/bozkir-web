import { test, expect } from '@playwright/test';

test.describe('Genel site gezinme', () => {
  test('ana sayfa bölümleri yüklenir', async ({ page }) => {
    await page.goto('/tr');
    await expect(page.locator('h1')).toBeVisible();
    // Vitrin/ürün bölümleri en az bir başlık içerir
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  });

  test('header menüsünden ürünlere gidilir', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'Masaüstü nav masaüstü projesinde test edilir');
    await page.goto('/tr');
    await page.locator('header a[href="/tr/urunler"], header a[href="/urunler"]').first().click();
    await expect(page).toHaveURL(/\/tr\/urunler/, { timeout: 15_000 });
  });

  test('statik sayfalar 200 döner ve başlık içerir', async ({ page }) => {
    for (const path of ['/tr/hakkimizda', '/tr/iletisim', '/tr/katalog', '/tr/bayilikler']) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBeLessThan(400);
      await expect(page.locator('h1').first(), path).toBeVisible();
    }
  });

  test('iletişim sayfası ofis + depo haritalarını gösterir', async ({ page }) => {
    await page.goto('/tr/iletisim');
    await expect(page.getByText('Depo konumu').first()).toBeVisible();
    const maps = page.locator('iframe[title*="konum"]');
    await expect(maps).toHaveCount(2);
    await expect(page.getByRole('link', { name: /Yol tarifi al/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Haritada aç/ })).toBeVisible();
  });

  test('footerda dil seçici yok (yalnızca headerda)', async ({ page }) => {
    await page.goto('/tr/iletisim');
    const footerSwitchers = page.locator('footer [aria-haspopup="listbox"]');
    await expect(footerSwitchers).toHaveCount(0);
    await expect(page.locator('header [aria-haspopup="listbox"]').first()).toBeVisible();
  });

  test('bakım sayfası içerik ve iletişim gösterir', async ({ page }) => {
    const res = await page.goto('/maintenance');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
    // İletişim kartları (telefon / e-posta) görünür
    await expect(page.locator('a[href^="tel:"], a[href^="mailto:"]').first()).toBeVisible();
  });

  test('rota geçişinde sayfa en üste kaydırılır', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'Masaüstü nav masaüstü projesinde test edilir');
    await page.goto('/tr');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('header a[href="/tr/urunler"], header a[href="/urunler"]').first().click();
    await expect(page).toHaveURL(/\/tr\/urunler/, { timeout: 15_000 });
    await page.waitForTimeout(700);
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeLessThan(50);
  });

  test('çalışma saatleri yeni aralığı gösterir', async ({ page }) => {
    await page.goto('/tr/iletisim');
    await expect(page.locator('main').getByText(/Cumartesi: 08:00 .{1,3} 14:00/).first()).toBeVisible();
  });

  test('bilinmeyen sayfa 404 içeriğini gösterir', async ({ page }) => {
    const res = await page.goto('/tr/bu-sayfa-yok-12345');
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/bulunamadı/i)).toBeVisible();
  });

  test('sitemap ve robots erişilebilir', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('/tr/urunler');
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
  });
});

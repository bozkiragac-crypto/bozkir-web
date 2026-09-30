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
    await expect(page.getByText('Depo konumu')).toBeVisible();
    const maps = page.locator('iframe[title*="konum"]');
    await expect(maps).toHaveCount(2);
  });

  test('çalışma saatleri yeni aralığı gösterir', async ({ page }) => {
    await page.goto('/tr/iletisim');
    await expect(page.getByText(/Cumartesi: 08:00 – 14:00/)).toBeVisible();
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

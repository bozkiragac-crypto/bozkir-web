import { test, expect, gotoWithRetry } from './fixtures';

test.describe('Ürünler ve katalog', () => {
  test('ürün listesi yüklenir ve kartlar görünür', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    await expect(page.locator('h1')).toBeVisible();
    // En az bir ürün linki
    await expect(page.locator('a[href*="/tr/urunler/"]').first()).toBeVisible();
  });

  test('arama filtresi sonuç getirir', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const search = page.getByPlaceholder(/Model, kod veya renk ara/i);
    await search.click();
    await search.fill('lak');
    await expect(search).toHaveValue('lak');
    await search.press('Enter');
    await expect(page).toHaveURL(/q=lak/, { timeout: 15_000 });
    await expect(page.locator('a[href*="/tr/urunler/"]').first()).toBeVisible();
  });

  test('ürün detay sayfası ve teklif CTA', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const firstProduct = page.locator('main a[href*="/tr/urunler/"]').first();
    await firstProduct.waitFor({ state: 'visible' });
    const href = await firstProduct.getAttribute('href');
    await firstProduct.click();
    if (href) await page.waitForURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 15_000 });
    await expect(page).toHaveURL(/\/tr\/urunler\/.+/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href*="teklif-al?urun="]').first()).toBeVisible();
  });

  test('kategori sayfası ürün gösterir', async ({ page }) => {
    const res = await gotoWithRetry(page, '/tr/kategoriler/mdflam');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href*="/tr/urunler/"]').first()).toBeVisible();
  });

  test('API: ürünler dile göre döner', async ({ request }) => {
    const res = await request.get('/api/products?limit=2&locale=en');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.items)).toBeTruthy();
    expect(json.items.length).toBeLessThanOrEqual(2);
  });

  test('API: geçersiz limit 400 döner', async ({ request }) => {
    const res = await request.get('/api/products?limit=999');
    expect(res.status()).toBe(400);
  });
});

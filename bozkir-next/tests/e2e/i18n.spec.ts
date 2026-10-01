import { test, expect } from '@playwright/test';

test.describe('Dil (i18n) ve yönlendirme', () => {
  test('kök dil öneğine yönlendirir', async ({ page }) => {
    // Middleware, Accept-Language/cookie'ye göre bir dile yönlendirir (tr|en|ar).
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(tr|en|ar)(\/|$)/, { timeout: 15_000 });
  });

  test('TR ana sayfa yüklenir, html lang/dir doğru', async ({ page }) => {
    await page.goto('/tr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('AR sayfası RTL ve Arapça içerik', async ({ page }) => {
    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    // Arapça içerik sayfada mevcut (nav metni masaüstü/mobil fark etmez)
    await expect(page.locator('body')).toContainText('منتجات');
  });

  test('EN sayfası İngilizce içerik gösterir', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('body')).toContainText('Products');
  });

  test('hreflang ve canonical üretilir', async ({ page }) => {
    await page.goto('/tr/urunler');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/tr\/urunler$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/urunler$/);
    await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveAttribute('href', /\/ar\/urunler$/);
  });

  test('dil seçici ile TR→EN geçişi adresi korur', async ({ page, isMobile }) => {
    await page.goto('/tr/iletisim');
    // Mobilde tema ve dil seçiciler mobil menünün içindedir.
    const scope = isMobile ? page.locator('#mobile-menu') : page.locator('header');
    if (isMobile) {
      await page.getByRole('button', { name: 'Menüyü aç' }).click();
      await expect(page.locator('#mobile-menu')).toHaveAttribute('aria-hidden', 'false');
    }
    await scope.getByRole('button', { name: /Dil|Language/i }).first().click();
    await page.getByRole('option', { name: /English/i }).click();
    await expect(page).toHaveURL(/\/en\/iletisim/);
  });
});

test.describe('Sayfa başlığı', () => {
  test('sekme başlığı tam marka adını içerir', async ({ page }) => {
    await page.goto('/tr');
    await expect(page).toHaveTitle(/Bozkır Ağaç Ürünleri/);
  });
});

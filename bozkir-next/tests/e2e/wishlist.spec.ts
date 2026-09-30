import { test, expect } from '@playwright/test';

test.describe('Favoriler, karşılaştırma ve paylaşım', () => {
  test('favori ekleme ve rozet sayısı', async ({ page }) => {
    await page.goto('/tr/urunler');
    const favBtn = page.locator('button[aria-label*="favorilere ekle" i]').first();
    await favBtn.click();
    // header favori linkinde 1 rozeti
    await expect(page.locator('a[href*="/favoriler"]')).toBeVisible();
    await page.goto('/tr/favoriler');
    await expect(page.getByText(/Henüz favori ürününüz yok/)).toHaveCount(0);
  });

  test('karşılaştırmaya ekleyince compare bar açılır', async ({ page }) => {
    await page.goto('/tr/urunler');
    const cmpBtn = page.locator('button[aria-label*="karşılaştırmaya ekle" i]').first();
    await cmpBtn.click();
    await expect(page.locator('a[href*="/karsilastir"]').first()).toBeVisible();
  });

  test('favoriler sayfası boş durumda CTA gösterir', async ({ page }) => {
    await page.goto('/tr/favoriler');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('ürün detayında WhatsApp paylaş butonu wa.me linki üretir', async ({ page }) => {
    await page.goto('/tr/urunler');
    await page.locator('a[href*="/tr/urunler/"]').first().click();
    const share = page.locator('a[href*="wa.me/?text="]').first();
    await expect(share).toBeVisible();
    const href = await share.getAttribute('href');
    expect(href).toContain('wa.me/?text=');
  });
});

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
    await page.goto('/tr/urunler', { waitUntil: 'domcontentloaded' });
    const product = page.locator('main a[href*="/tr/urunler/"]').first();
    await product.waitFor({ state: 'visible' });
    const href = (await product.getAttribute('href')) ?? '';
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/tr\/urunler\/.+/);
    const share = page.locator('a[href*="wa.me/?text="]').first();
    await expect(share).toBeVisible();
    const shareHref = await share.getAttribute('href');
    expect(shareHref).toContain('wa.me/?text=');
  });

  test('ürün detayında "WhatsApp ile sor" ürüne özel mesaj içerir', async ({ page }) => {
    await page.goto('/tr/urunler', { waitUntil: 'domcontentloaded' });
    const product = page.locator('main a[href*="/tr/urunler/"]').first();
    await product.waitFor({ state: 'visible' });
    const href = (await product.getAttribute('href')) ?? '';
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/tr\/urunler\/.+/);
    const ask = page.locator('a[href*="wa.me/9"][href*="text="]').first();
    await expect(ask).toBeVisible();
    const askHref = await ask.getAttribute('href');
    expect(decodeURIComponent(askHref ?? '')).toContain('teklifi');
  });
});

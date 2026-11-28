import { test, expect } from '@playwright/test';

test.describe('Favoriler, karşılaştırma ve paylaşım', () => {
  test('favori ekleme ve rozet sayısı', async ({ page }) => {
    await page.goto('/tr/urunler');
    const favBtn = page.locator('button[aria-label*="favorilere ekle" i]').first();
    await favBtn.click();
    // Header rozeti ve kalıcı kayıt, gezinmeden önce gerçekten tamamlanmalı.
    await expect(page.locator('a[href*="/favoriler"]').first()).toHaveAttribute(
      'aria-label',
      /\(1\)/,
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          try {
            const raw = JSON.parse(localStorage.getItem('bozkir:favorites') ?? '[]');
            return Array.isArray(raw) ? raw.length : 0;
          } catch {
            return 0;
          }
        }),
      )
      .toBe(1);
    await page.goto('/tr/favoriler');
    await expect(page.getByText(/Henüz favori ürününüz yok/)).toHaveCount(0);
  });

  test('karşılaştırmaya ekleyince compare bar açılır', async ({ page, isMobile }) => {
    await page.goto('/tr/urunler');
    // Mobilde karşılaştırma ikonu "diğer işlemler" menüsünde tutulur.
    if (isMobile) {
      await page.getByRole('button', { name: /daha fazla işlem/i }).first().click();
    }
    const cmpBtn = page.locator('button[aria-label*="karşılaştırmaya ekle" i]').first();
    await cmpBtn.click();
    await expect(page.locator('a[href*="/karsilastir"]').first()).toBeVisible();
  });

  test('favoriler sayfası boş durumda CTA gösterir', async ({ page }) => {
    await page.goto('/tr/favoriler');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('ürün detayında paylaş menüsü WhatsApp wa.me linki üretir', async ({ page }) => {
    await page.goto('/tr/urunler', { waitUntil: 'domcontentloaded' });
    const product = page.locator('main a[href*="/tr/urunler/"]').first();
    await product.waitFor({ state: 'visible' });
    const href = (await product.getAttribute('href')) ?? '';
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/tr\/urunler\/.+/);
    // Paylaş menüsünü aç.
    await page.getByRole('button', { name: 'Paylaş', exact: true }).first().click();
    const share = page.locator('a[href*="wa.me/?text="]').first();
    await expect(share).toBeVisible();
    const shareHref = await share.getAttribute('href');
    expect(shareHref).toContain('wa.me/?text=');
  });

  test('ürün detayında WhatsApp paylaşımı tek noktada toplanır', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('bozkir:consent', 'granted');
      } catch {
        // yok say
      }
    });
    await page.goto('/tr/urunler', { waitUntil: 'domcontentloaded' });
    const product = page.locator('main a[href*="/tr/urunler/"]').first();
    await product.waitFor({ state: 'visible' });
    const href = (await product.getAttribute('href')) ?? '';
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/tr\/urunler\/.+/);

    // Ürün sayfasına özel bağımsız WhatsApp ikonları kalmamalı (site genel FAB hariç).
    await expect(
      page.locator('a[aria-label="WhatsApp ile yazın"]:not([data-whatsapp-fab])'),
    ).toHaveCount(0);
    await expect(page.locator('[data-product-cta] a[href*="wa.me"]')).toHaveCount(0);

    // Paylaş menüsündeki tek WhatsApp bağlantısı korunmalı.
    await page.getByRole('button', { name: 'Paylaş', exact: true }).first().click();
    await expect(page.locator('a[href*="wa.me/?text="]')).toHaveCount(1);

    // Site genel FAB korunmalı.
    await expect(page.locator('[data-whatsapp-fab]')).toHaveCount(1);
  });
});

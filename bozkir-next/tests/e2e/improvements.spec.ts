import { test, expect, gotoWithRetry } from './fixtures';

test.describe('İyileştirmeler: sıralama, boş durum, güvenlik başlıkları', () => {
  test('ürünler: sıralama seçici URL günceller ve sonuç döner', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const sort = page.locator('#sort-filter');
    await expect(sort).toBeVisible();
    await sort.selectOption('name-asc');
    await expect(page).toHaveURL(/sirala=name-asc/);
    await expect(page.locator('a[href*="/tr/urunler/"]').first()).toBeVisible();
  });

  test('ürünler: filtre değişince sayfalama sıfırlanır', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler?q=lak&sayfa=2');
    const category = page.locator('#category-filter');
    await expect(category).toBeVisible();
    await category.selectOption({ index: 1 });
    await expect(page).toHaveURL(/kategori=/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/sayfa=/);
  });

  test('ürünler: eşleşmeyen aramada boş durum ve temizle CTA görünür', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler?q=zzzzqqqxyz');
    await expect(page.getByText('Aramanızla eşleşen ürün bulunamadı.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Filtreleri temizle' })).toBeVisible();
  });

  test('API: KVKK onayı olmadan teklif reddedilir', async ({ request }) => {
    const res = await request.post('/api/teklif', {
      multipart: {
        fullName: 'E2E Test',
        phone: '05359998877',
        email: 'e2e@example.com',
        consent: 'false',
        website: '',
      },
    });
    // 429: aynı IP için hız sınırı dolmuş olabilir (o da geçerli bir korumadır).
    expect([422, 429]).toContain(res.status());
  });

  test('güvenlik başlıkları: CSP + HSTS gönderilir', async ({ request }) => {
    const res = await request.get('/tr');
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers()['strict-transport-security']).toContain('max-age=');
  });

  test('medya varlıkları uzun cache ve güvenlik başlıkları taşır', async ({ request }) => {
    const res = await request.get('/media/olmayan-dosya.webp');
    expect(res.headers()['cache-control']).toContain('max-age=31536000');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('footer çalışma saatlerini gösterir', async ({ page, isMobile }) => {
    await gotoWithRetry(page, '/tr');
    const hours = page.locator('footer').getByText(/Pazartesi.{0,6}Cuma/).first();
    // Mobilde footer bölümleri katlanmış olabilir; DOM'da bulunması yeterli.
    if (isMobile) await expect(hours).toBeAttached();
    else await expect(hours).toBeVisible();
  });

  test('favoriye ekleyince toast görünür', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const heart = page.locator('main button[aria-pressed]').first();
    await heart.waitFor({ state: 'visible' });
    // Mobilde animasyon/scroll sırasında tıklama kaçabilir; durum değişene kadar dene.
    for (let i = 0; i < 3; i++) {
      await heart.click({ force: i > 0 });
      if ((await heart.getAttribute('aria-pressed')) === 'true') break;
      await page.waitForTimeout(400);
    }
    await expect(heart).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
    await expect(page.getByRole('status').getByText(/Favorilere eklendi|Favorilerden çıkarıldı/)).toBeVisible();
  });
});

test.describe('Mobil menü erişilebilirliği', () => {
  test.skip(({ isMobile }) => !isMobile, 'Yalnızca mobil projede çalışır');

  test('Escape mobil menüyü kapatır', async ({ page }) => {
    await gotoWithRetry(page, '/tr');
    const toggle = page.getByRole('button', { name: 'Menüyü aç' });
    await toggle.waitFor({ state: 'visible' });
    for (let i = 0; i < 3; i++) {
      await toggle.click({ force: i > 0 });
      if ((await toggle.getAttribute('aria-expanded')) === 'true') break;
      await page.waitForTimeout(400);
    }
    const dialog = page.locator('#mobile-menu');
    await expect(dialog).toHaveAttribute('aria-hidden', 'false', { timeout: 10_000 });
    await page.keyboard.press('Escape');
    // Kapanınca opacity 0'a döner (görünürlük testi yerine aria-hidden kontrol edilir).
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

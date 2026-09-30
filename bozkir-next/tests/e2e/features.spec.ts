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
    await expect
      .poll(async () => (await page.locator('script[type="application/ld+json"]').allTextContents()).some((t) => t.includes('FAQPage')), {
        timeout: 10_000,
      })
      .toBe(true);
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

  test('çerez onay bandı görünür, kabul edilince kaybolur ve tercih kaydedilir', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/tr', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('bozkir:consent'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    const banner = page.getByRole('dialog', { name: 'Çerez Politikası' });
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Kabul Et' }).click();
    await expect(banner).toBeHidden();

    const stored = await page.evaluate(() => localStorage.getItem('bozkir:consent'));
    expect(stored).toBe('granted');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('dialog', { name: 'Çerez Politikası' })).toBeHidden();
  });

  test('paylaşılan liste bağlantısı favorilere ürün ekler ve URL temizlenir', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const slugs = await page.locator('main a[href*="/tr/urunler/"]').evaluateAll((els) =>
      els
        .map((e) => (e.getAttribute('href') ?? '').split('/tr/urunler/')[1])
        .filter(Boolean)
        .slice(0, 2),
    );
    expect(slugs.length).toBeGreaterThan(0);

    await page.goto(`/tr/favoriler?liste=${slugs.join(',')}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Paylaşılan liste eklendi')).toBeVisible({ timeout: 15_000 });
    await expect(page).not.toHaveURL(/liste=/);
    const count = await page.evaluate(() => {
      const raw = localStorage.getItem('bozkir:favorites');
      return raw ? (JSON.parse(raw) as unknown[]).length : 0;
    });
    expect(count).toBeGreaterThan(0);
  });

  test('kategori sayfası içi arama ve sayfalama parametresi çalışır', async ({ page }) => {
    await gotoWithRetry(page, '/tr/kategoriler');
    const cat = page.locator('main a[href*="/tr/kategoriler/"]').first();
    await cat.waitFor({ state: 'visible' });
    const href = (await cat.getAttribute('href')) ?? '';
    expect(href).toMatch(/\/tr\/kategoriler\/.+/);
    await page.goto(href, { waitUntil: 'domcontentloaded' });

    // Sayfalama parametresi hata üretmemeli.
    const res = await page.goto(`${href}?sayfa=2`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBeLessThan(400);

    // Kategori içi arama formu var ve gönderimde `q` parametresi ekler.
    const search = page.getByRole('textbox', { name: 'Arama' }).first();
    await expect(search).toBeVisible();
    await search.fill('a');
    await search.press('Enter');
    await expect(page).toHaveURL(/[?&]q=a/);
  });

  test('ürün dinamik OG görseli PNG döner', async ({ page, request }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const product = page.locator('main a[href*="/tr/urunler/"]').first();
    await product.waitFor({ state: 'visible' });
    const href = (await product.getAttribute('href')) ?? '';

    const html = await (await request.get(href)).text();
    const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    expect(og, 'og:image etiketi bulunmalı').toBeTruthy();

    const path = new URL(og!).pathname + new URL(og!).search;
    const img = await request.get(path);
    expect(img.status()).toBe(200);
    expect(img.headers()['content-type']).toContain('image/png');
  });
});

test.describe('Admin yeni özellikler', () => {
  test('ayarlar: 2FA, popup ve webhook alanları', async ({ adminPage }) => {
    await adminPage.goto('/admin/ayarlar', { waitUntil: 'domcontentloaded' });
    await expect(adminPage.getByText('İki Adımlı Doğrulama (2FA)')).toBeVisible();
    await expect(adminPage.getByText('Kampanya popup')).toBeVisible();
    await expect(adminPage.getByText('Webhook').first()).toBeVisible();
  });

  test('owner menüde Kullanıcılar/Ayarlar görünür', async ({ adminPage }) => {
    await adminPage.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(adminPage.getByRole('link', { name: 'Kullanıcılar' }).first()).toBeVisible();
    await expect(adminPage.getByRole('link', { name: 'Ayarlar' }).first()).toBeVisible();
  });

  test('toplu çeviri sayfası açılır', async ({ adminPage }) => {
    await adminPage.goto('/admin/ceviri', { waitUntil: 'domcontentloaded' });
    await expect(adminPage.getByRole('heading', { name: 'Toplu Çeviri' })).toBeVisible();
    await expect(adminPage.getByText('Eksik çeviri yok', { exact: false }).or(adminPage.getByText('eksik', { exact: false })).first()).toBeVisible();
  });
});

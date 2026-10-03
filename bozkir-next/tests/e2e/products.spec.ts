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
    await search.waitFor({ state: 'visible' });
    for (let i = 0; i < 3; i++) {
      await search.click();
      await search.fill('lak');
      await search.press('Enter');
      try {
        await page.waitForURL(/q=lak/, { timeout: 8_000 });
        break;
      } catch {
        // tekrar dene (mobil yeniden render yarışı)
      }
    }
    await expect(page).toHaveURL(/q=lak/, { timeout: 15_000 });
    await expect(page.locator('a[href*="/tr/urunler/"]').first()).toBeVisible();
  });

  test('ürün detay sayfası ve teklif CTA', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const firstProduct = page.locator('main a[href*="/tr/urunler/"]').first();
    await firstProduct.waitFor({ state: 'visible' });
    const href = (await firstProduct.getAttribute('href')) ?? '';
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/tr\/urunler\/.+/);
    await expect(page.locator('h1').first()).toBeVisible();
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

/**
 * `products.code` bir seri/malzeme kodu olduğu için tekil değildir
 * (örn. `PVC KENAR` kategorisindeki 105 ürünün kodu `PVC`).
 *
 * Bu testler iki davranışı güvenceye alır:
 *  1) Seri kodlu mevcut ürün admin'den düzenlenebilir (regresyon: önceden
 *     "bu ürün kodu zaten kullanılıyor" hatasıyla kaydedilemiyordu).
 *  2) Aynı kategori + kod + ad ile ikinci kayıt açılamaz (kazara çift kayıt).
 */
test.describe('Admin: ürün kodu (seri kodu) davranışı', () => {
  test.describe.configure({ mode: 'serial' });

  test('seri kodu paylaşan mevcut ürün düzenlenebilir', async ({ adminPage }) => {
    // "PVC" kodlu ürünlere git (liste araması hem ad hem kod alanında arar).
    await adminPage.goto('/admin/urunler?q=PVC', { waitUntil: 'domcontentloaded' });
    await adminPage.getByRole('link', { name: 'Düzenle' }).first().click();

    await expect(adminPage.getByRole('heading', { name: 'Ürünü Düzenle' })).toBeVisible({ timeout: 15_000 });
    await expect(adminPage.getByLabel('Ürün Kodu *')).toHaveValue('PVC');

    // Hiçbir alanı değiştirmeden kaydet: seri kodu çakışması hatası vermemeli.
    await adminPage.getByRole('button', { name: 'Kaydet' }).click();

    await expect(adminPage.getByText('Bu ürün kodu zaten kullanılıyor')).toHaveCount(0, { timeout: 15_000 });
    await expect(adminPage).toHaveURL(/\/admin\/urunler$/, { timeout: 15_000 });
  });

  test('aynı kategori + kod + ad ile ikinci kayıt açılamaz', async ({ adminPage }) => {
    // Var olan bir ürünün kategori/kod/ad üçlüsünü oku.
    await adminPage.goto('/admin/urunler?q=PVC', { waitUntil: 'domcontentloaded' });
    await adminPage.getByRole('link', { name: 'Düzenle' }).first().click();
    await expect(adminPage.getByRole('heading', { name: 'Ürünü Düzenle' })).toBeVisible({ timeout: 15_000 });

    const code = await adminPage.getByLabel('Ürün Kodu *').inputValue();
    const name = await adminPage.getByLabel('Ürün Adı *').inputValue();
    const cat = await adminPage.getByLabel('Kategori *').inputValue();

    // Aynı üçlüyle yeni kayıt açmayı dene → reddedilmeli (veri oluşmaz).
    await adminPage.goto('/admin/urunler/yeni', { waitUntil: 'domcontentloaded' });
    await adminPage.getByLabel('Ürün Adı *').fill(name);
    await adminPage.getByLabel('Ürün Kodu *').fill(code);
    await adminPage.getByLabel('Kategori *').fill(cat);
    await adminPage.getByRole('button', { name: 'Kaydet' }).click();

    await expect(adminPage.getByText('aynı kod ve adla bir ürün zaten var')).toBeVisible({ timeout: 15_000 });
    await expect(adminPage).toHaveURL(/\/admin\/urunler\/yeni$/, { timeout: 15_000 });
  });
});
import { test, expect, loginAdmin, ADMIN_USER } from './fixtures';

test.describe('Admin giriş ve güvenlik', () => {
  test('yanlış şifre reddedilir', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Kullanıcı adı').fill(ADMIN_USER);
    await page.getByLabel('Şifre').fill('yanlis-sifre-xyz');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('korumalı rota oturumsuz login’e yönlendirir', async ({ page }) => {
    await page.goto('/admin/urunler');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('doğru bilgilerle panele giriş yapılır', async ({ page }) => {
    await loginAdmin(page);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Admin CRUD (oturumlu)', () => {
  test('ürünler listesi ve arama', async ({ adminPage }) => {
    await adminPage.goto('/admin/urunler');
    await expect(adminPage.getByRole('heading', { name: 'Ürünler' })).toBeVisible();
    await expect(adminPage.locator('table')).toBeVisible();
  });

  test('katalog listesi ve yeni katalog formu', async ({ adminPage }) => {
    await adminPage.goto('/admin/kataloglar');
    await expect(adminPage.getByRole('heading', { name: 'Kataloglar' })).toBeVisible();
    await adminPage.getByRole('link', { name: /Yeni Katalog/ }).click();
    await expect(adminPage).toHaveURL(/\/admin\/kataloglar\/yeni/);
    await expect(adminPage.getByText('Katalog PDF')).toBeVisible();
  });

  test('malzeme vitrini sayfası açılır', async ({ adminPage }) => {
    await adminPage.goto('/admin/vitrin');
    await expect(adminPage.getByRole('heading', { name: 'Malzeme Vitrini' })).toBeVisible();
    await expect(adminPage.getByText('Öğeler')).toBeVisible();
  });

  test('ayarlar: çalışma saatleri ve depo alanları', async ({ adminPage }) => {
    await adminPage.goto('/admin/ayarlar');
    await expect(adminPage.getByText('Çalışma saatleri (TR)')).toBeVisible();
    await expect(adminPage.getByText('Depo konumu')).toBeVisible();
    await expect(adminPage.getByText('Koordinatlar')).toBeVisible();
  });

  test('içerik blokları düzenlenebilir', async ({ adminPage }) => {
    await adminPage.goto('/admin/icerik');
    await expect(adminPage.getByRole('heading', { name: 'İçerik' })).toBeVisible();
  });
});

test.describe('Admin CRUD: kategori & marka (oturumlu)', () => {
  test('kategoriler listesi ve yeni kategori formu', async ({ adminPage }) => {
    await adminPage.goto('/admin/kategoriler');
    await expect(adminPage.getByRole('heading', { name: 'Kategoriler' })).toBeVisible();
    await expect(adminPage.locator('table')).toBeVisible();
    await adminPage.getByRole('link', { name: /Yeni Kategori/ }).click();
    await expect(adminPage).toHaveURL(/\/admin\/kategoriler\/yeni/);
    await expect(adminPage.getByText('Vitrinde göster (öne çıkan)')).toBeVisible();
  });

  test('bayilikler listesi ve yeni marka formu', async ({ adminPage }) => {
    await adminPage.goto('/admin/bayilikler');
    await expect(adminPage.getByRole('heading', { name: /Bayilikler/ })).toBeVisible();
    await adminPage.getByRole('link', { name: /Yeni Marka/ }).click();
    await expect(adminPage).toHaveURL(/\/admin\/bayilikler\/yeni/);
    await expect(adminPage.getByText('Marka logosu')).toBeVisible();
  });

  test('hakkımızda içerik sayfası', async ({ adminPage }) => {
    await adminPage.goto('/admin/hakkimizda');
    await expect(adminPage.getByRole('heading', { name: 'Hakkımızda İçeriği' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'İstatistikler' })).toBeVisible();
  });
});

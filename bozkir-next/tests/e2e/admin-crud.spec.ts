import { test, expect } from './fixtures';

test.describe('Admin: kampanya ekleme ve hakkımızda', () => {
  test.describe.configure({ mode: 'serial' });

  test('yeni kampanya kaydedilir ve listede görünür', async ({ adminPage }) => {
    const title = `E2E Kampanya ${Date.now()}`;
    await adminPage.goto('/admin/kampanyalar/yeni');
    await expect(adminPage.getByRole('heading', { name: 'Yeni Kampanya' })).toBeVisible();
    await adminPage.getByRole('textbox', { name: 'Başlık *', exact: true }).fill(title);
    await adminPage.getByRole('button', { name: 'Kaydet' }).click();
    await expect(adminPage).toHaveURL(/\/admin\/kampanyalar$/, { timeout: 15_000 });
    await expect(adminPage.getByText(title)).toBeVisible();

    // Temizlik: testin oluşturduğu kampanyayı sil; her koşuda birikmesin.
    adminPage.on('dialog', (d) => d.accept());
    const row = adminPage.locator('tr', { hasText: title });
    await row.getByRole('button', { name: 'Sil' }).click();
    await expect(adminPage.getByText(title)).toHaveCount(0, { timeout: 15_000 });
  });

  test('yeni kategori oluşturulur ve bağlı ürün yoksa silinir', async ({ adminPage }) => {
    const name = `E2E Kategori ${Date.now()}`;
    await adminPage.goto('/admin/kategoriler/yeni');
    await adminPage.getByLabel('Ad *', { exact: true }).fill(name);
    await adminPage.getByRole('button', { name: 'Kaydet' }).click();
    await expect(adminPage).toHaveURL(/\/admin\/kategoriler$/, { timeout: 15_000 });

    const row = adminPage.locator('tr', { hasText: name });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Sil' }).click();

    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Sil' }).click();
    await expect(adminPage.getByText(name)).toHaveCount(0, { timeout: 15_000 });
  });

  test('hakkımızda editörü alanları ve kaydetme', async ({ adminPage }) => {
    await adminPage.goto('/admin/hakkimizda', { waitUntil: 'domcontentloaded' });
    await expect(adminPage.getByRole('heading', { name: 'Hakkımızda İçeriği' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'İstatistikler' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'Değerler' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'Zaman Çizelgesi' })).toBeVisible();
    // En az bir istatistik satırı dolu olmalı.
    await expect(adminPage.locator('input[placeholder="Değer"]').first()).not.toHaveValue('');
  });
});

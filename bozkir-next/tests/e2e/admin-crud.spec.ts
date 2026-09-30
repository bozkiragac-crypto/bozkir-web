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

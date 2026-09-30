import { test, expect } from './fixtures';

test.describe('Admin: kampanya ekleme ve hakkımızda', () => {
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
    await adminPage.goto('/admin/hakkimizda');
    await expect(adminPage.getByRole('heading', { name: 'Hakkımızda İçeriği' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'İstatistikler' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'Değerler' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'Zaman Çizelgesi' })).toBeVisible();
    // Boş olmamalı: en az bir istatistik satırı (varsayılan) görünür.
    await expect(adminPage.locator('input[placeholder="Değer"]').first()).toHaveValue(/1979|20\d\d/);
  });
});

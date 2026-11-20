import { test, expect } from './fixtures';

/** OSB ürünleri ve kategorisi siteden tamamen kaldırılmalı. */
test('OSB kategorisi ve ürünleri sitede hiç görünmez', async ({ request, page }) => {
  const categoriesResponse = await request.get('/api/categories');
  expect(categoriesResponse.ok()).toBeTruthy();
  const categories = await categoriesResponse.json();
  expect(categories).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ slug: 'osb' })]),
  );
  expect(JSON.stringify(categories).toLowerCase()).not.toContain('osb');

  const productsResponse = await request.get('/api/products?q=osb&limit=100');
  expect(productsResponse.ok()).toBeTruthy();
  const products = await productsResponse.json();
  expect(products.items).toEqual([]);
  expect(products.total).toBe(0);

  // Dinamik kategori rotası bulunamayan slug'da notFound içeriğini stream eder;
  // önemli olan HTTP kodu değil, OSB'nin görünür içerikte yer almaması.
  await page.goto('/tr/kategoriler/osb');
  await expect(page.getByText(/bulunamadı/i).first()).toBeVisible();
  await expect(page.getByText('OSB', { exact: true })).toHaveCount(0);
});

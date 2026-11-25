import { test, expect, gotoWithRetry } from './fixtures';
import type { APIRequestContext, Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

async function openFirstProduct(page: Page): Promise<void> {
  await gotoWithRetry(page, '/tr/urunler');
  const first = page.locator('main a[href*="/tr/urunler/"]').first();
  await first.waitFor({ state: 'visible' });
  const href = await first.getAttribute('href');
  expect(href).toBeTruthy();
  await gotoWithRetry(page, href!);
}

async function seedCompare(page: Page, request: APIRequestContext): Promise<void> {
  const response = await request.get('/api/products?limit=2');
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as {
    items: Array<{
      id: string;
      slug: string;
      name: string;
      code?: string;
      category: string;
      thumbnail?: string;
      images?: string[];
    }>;
  };
  const refs = json.items.slice(0, 2).map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    code: item.code,
    category: item.category,
    image: item.thumbnail ?? item.images?.[0],
  }));
  expect(refs.length).toBeGreaterThan(0);

  await page.addInitScript((items) => {
    localStorage.setItem('bozkir:compare', JSON.stringify(items));
  }, refs);
  await gotoWithRetry(page, '/tr/karsilastir');
}

test.describe('Yazdırma görünümü', () => {
  test('ürün yazdırmada büyütme butonu gizli', async ({ page, isMobile }) => {
    await openFirstProduct(page);
    // Mobilde galeri zaten `no-print`; masaüstündeki büyütme düğmesi ayrıca gizlenmeli.
    const expand = isMobile
      ? page.getByRole('button', { name: /Görseli büyüt/ }).first()
      : page.getByRole('button', { name: 'Görseli büyüt', exact: true });
    if (!isMobile) await expect(expand).toBeVisible();

    await page.emulateMedia({ media: 'print' });

    await expect(expand).toBeHidden();
  });

  test('yazdırmada print alanı bölünebilir, görseller bölünmez', async ({ page }) => {
    await openFirstProduct(page);
    await page.emulateMedia({ media: 'print' });

    const areaBreak = await page
      .locator('[data-print-area]')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside);
    expect(areaBreak).not.toBe('avoid');

    const imageBreak = await page
      .locator('[data-print-area] img')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside);
    expect(imageBreak).toBe('avoid');
  });

  test('karşılaştırma yazdırmada başlık görünür', async ({ page, request }) => {
    await seedCompare(page, request);
    const heading = page.getByRole('heading', { name: 'Ürün Karşılaştırma' });
    await expect(heading).toBeVisible();

    await page.emulateMedia({ media: 'print' });

    await expect(heading).toBeVisible();
  });

  test('karşılaştırma yazdırmada marka logosu görünür', async ({ page, request }) => {
    await seedCompare(page, request);
    const logo = page.getByRole('img', { name: 'Bozkır Ağaç Ürünleri' }).first();

    await page.emulateMedia({ media: 'print' });

    await expect(logo).toBeVisible();
  });

  test('karşılaştırma yazdırmada kaldırma butonları gizli', async ({ page, request }) => {
    await seedCompare(page, request);
    const remove = page.getByRole('button', { name: 'Ürünü tekliften çıkar' }).first();
    await expect(remove).toBeVisible();

    await page.emulateMedia({ media: 'print' });

    await expect(remove).toBeHidden();
  });
});

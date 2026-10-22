import { test, expect, gotoWithRetry } from './fixtures';

test.describe('Vitrin, galeri ve gezinme iyileştirmeleri', () => {
  test('vitrin kartı lightbox açar ve sağ/sol gezinir', async ({ page }) => {
    await gotoWithRetry(page, '/tr');
    const tile = page.locator('#vitrin button[aria-haspopup="dialog"]').first();
    if ((await tile.count()) === 0) test.skip(true, 'Vitrin bölümü yok');

    await tile.scrollIntoViewIfNeeded();
    await tile.click();

    const dialog = page.locator('[role="dialog"][data-lenis-prevent]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/1 \/ \d+/)).toBeVisible();

    await dialog.getByRole('button', { name: 'Sonraki', exact: true }).click();
    await expect(dialog.getByText(/2 \/ \d+/)).toBeVisible();
  });

  test('ürün galerisi okları ve klavye ile gezinir', async ({ page, request }) => {
    const res = await request.get('/api/products?limit=100');
    const json = await res.json();
    const product = (json.items ?? []).find(
      (item: { images?: string[] }) => (item.images?.length ?? 0) > 1,
    );
    if (!product) test.skip(true, 'Birden fazla görselli ürün yok');

    await gotoWithRetry(page, `/tr/urunler/${product.slug}`);
    const current = page.locator('button[aria-current="true"]:visible').first();
    await expect(current).toHaveAttribute('aria-label', /^1 \//);

    const next = page.locator('[aria-label="Sonraki görsel"]:visible').first();
    await next.click();
    await expect(page.locator('button[aria-current="true"]:visible').first()).toHaveAttribute(
      'aria-label',
      /^2 \//,
    );

    // Odak oktayken klavye ile geri dön.
    await next.focus();
    await next.press('ArrowLeft');
    await expect(page.locator('button[aria-current="true"]:visible').first()).toHaveAttribute(
      'aria-label',
      /^1 \//,
    );
  });

  test('sayfalama en üstten açılır', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const nextPage = page.getByRole('link', { name: 'Sonraki', exact: true });
    if ((await nextPage.count()) === 0) test.skip(true, 'Tek sayfa ürün');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await nextPage.last().click();
    await page.waitForURL(/sayfa=2/);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 8_000 })
      .toBeLessThan(80);
  });

  test('ürün detayından geri dönüşte sayfa en üstte', async ({ page }) => {
    await gotoWithRetry(page, '/tr/urunler');
    const productLink = page.locator('main a[href*="/tr/urunler/"]').last();
    await productLink.scrollIntoViewIfNeeded();
    const href = await productLink.getAttribute('href');
    if (!href) test.skip(true, 'Ürün bağlantısı yok');

    await productLink.click();
    await page.waitForURL(/\/tr\/urunler\/.+/);
    await page.goBack();
    await page.waitForURL(/\/tr\/urunler(\?|$)/);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 8_000 })
      .toBeLessThan(80);
  });

  test('WhatsApp mesajı firma adı içermez', async ({ page }) => {
    await gotoWithRetry(page, '/tr');
    const fab = page.locator('[data-whatsapp-fab]').first();
    const href = await fab.getAttribute('href');
    if (!href) test.skip(true, 'WhatsApp bağlantısı yok');

    const text = new URL(href!).searchParams.get('text') ?? '';
    expect(text).not.toContain('Bozkır Ağaç Ürünleri');
    expect(text).not.toContain('Bozkır Wood Products');
    expect(text).toContain('ürünleriniz');
  });
});

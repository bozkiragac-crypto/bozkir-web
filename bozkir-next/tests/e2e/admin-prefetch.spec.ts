import { test, expect } from './fixtures';

/**
 * Admin sayfaları force-dynamic: her `_rsc` prefetch bir DB sorgusu ve bir
 * router geçişi demek. Ürün listesinde hem satır linkleri hem "Yeni Ürün"
 * hem de yan menü linkleri prefetch ediliyordu. Bir prefetch, tıklanan satırın
 * gezinmesi tamamlanmadan biterse Next router o geçişi düşürüyor ve sayfa
 * listeler kalıyordu (`waitForURL` timeout).
 */
test('admin ürün listesi admin rotaları için RSC prefetch yapmaz', async ({
  adminPage,
}) => {
  const prefetches: string[] = [];
  adminPage.on('request', (req) => {
    const url = new URL(req.url());
    if (url.searchParams.has('_rsc') && url.pathname.startsWith('/admin')) {
      prefetches.push(url.pathname);
    }
  });

  await adminPage.goto('/admin/urunler?q=PVC', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.getByRole('link', { name: 'Düzenle' }).first()).toBeVisible({
    timeout: 15_000,
  });
  // Prefetch scheduler biraz gecikmeli çalışır; ölçümü o pencereyi kapsayacak şekilde yap.
  await adminPage.waitForTimeout(1500);

  expect(
    prefetches,
    `admin rotaları için ${prefetches.length} prefetch isteği yapıldı`,
  ).toHaveLength(0);
});

/**
 * Kaydet sonrası geri dönüş ve "Yeni Marka" gezinmesi de aynı yarışa düşüyordu:
 * formdaki geri linki / liste sayfasındaki satır linkleri prefetch ediliyor,
 * POST redirect'in RSC yanıtı bu prefetch tarafından geçersiz kılınıyordu.
 */
for (const path of ['/admin/kategoriler/yeni', '/admin/bayilikler']) {
  test(`${path} admin rotaları için RSC prefetch yapmaz`, async ({ adminPage }) => {
    const prefetches: string[] = [];
    adminPage.on('request', (req) => {
      const url = new URL(req.url());
      if (url.searchParams.has('_rsc') && url.pathname.startsWith('/admin')) {
        prefetches.push(url.pathname);
      }
    });

    await adminPage.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(adminPage.locator('main')).toBeVisible({ timeout: 15_000 });
    await adminPage.waitForTimeout(1500);

    expect(
      prefetches,
      `${path} sayfasında ${prefetches.length} prefetch isteği yapıldı`,
    ).toHaveLength(0);
  });
}

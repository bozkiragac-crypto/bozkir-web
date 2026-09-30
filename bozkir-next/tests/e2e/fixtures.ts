import { test as base, expect, type Page } from '@playwright/test';

/** Test için yönetici kimlik bilgileri (env veya varsayılan). */
export const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'bozkir';
export const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? 'Bozkir.1905';

/** Admin oturumu açar ve `storageState` üretir; admin testleri bunu kullanır. */
export async function loginAdmin(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.getByLabel('Kullanıcı adı').fill(ADMIN_USER);
  await page.getByLabel('Şifre').fill(ADMIN_PASS);
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  await page.waitForURL('**/admin', { timeout: 15_000 });
  await expect(page.locator('main')).toBeVisible();
}

/** Admin oturumsuz, açık oturumlu bir test context'i sağlar. */
export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAdmin(page);
    await use(page);
    await context.close();
  },
});

export { expect };

/**
 * Cold-start (on-demand ISR) ve geçici bağlantı resetlerine dayanıklı gezinme.
 * İlk istekte üretilen sayfalar için birkaç kez dener.
 */
export async function gotoWithRetry(
  page: Page,
  url: string,
  attempts = 3,
): Promise<import('@playwright/test').Response | null> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    } catch (err) {
      last = err;
      await page.waitForTimeout(800);
    }
  }
  throw last;
}

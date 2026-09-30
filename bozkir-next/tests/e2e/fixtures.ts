import { test as base, expect, type Page } from '@playwright/test';
import { existsSync } from 'node:fs';
import { ADMIN_STATE_PATH } from './global-setup';

/** Test için yönetici kimlik bilgileri (env veya varsayılan). */
export const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'bozkir';
export const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? 'Bozkir.1905';

/** Admin oturumu açar ve panele girer (yalnızca gerektiğinde; normalde globalSetup kullanılır). */
export async function loginAdmin(page: Page): Promise<void> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.getByLabel('Kullanıcı adı').fill(ADMIN_USER);
      await page.getByLabel('Şifre').fill(ADMIN_PASS);
      await page.getByRole('button', { name: 'Giriş Yap' }).click();
      await page.waitForURL('**/admin', { timeout: 20_000, waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      return;
    } catch (err) {
      last = err;
      await page.waitForTimeout(1000);
    }
  }
  throw last;
}

/**
 * Admin oturumlu bir test context'i sağlar.
 * Oturum globalSetup'ta bir kez açılır ve storageState dosyasından okunur (paralel login yarışı yok).
 */
export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const hasState = existsSync(ADMIN_STATE_PATH);
    const context = await browser.newContext(hasState ? { storageState: ADMIN_STATE_PATH } : {});
    const page = await context.newPage();
    // Sekme bazlı oturum işareti (sessionStorage storageState ile taşınmaz).
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('bozkir_admin_tab', '1');
      } catch {
        // yok say
      }
    });
    if (!hasState) await loginAdmin(page);
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

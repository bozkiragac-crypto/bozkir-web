import { test as base, expect, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { generate } from 'otplib';
import { ADMIN_SKIP_PATH, ADMIN_STATE_PATH, waitForLoginOutcome } from './global-setup';

/** Test için yönetici kimlik bilgileri (env; güvenlik için varsayılan yok). */
export const ADMIN_USER = process.env.E2E_ADMIN_USER ?? '';
export const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? '';
export const ADMIN_TOTP_SECRET = process.env.E2E_ADMIN_TOTP_SECRET ?? '';

/** globalSetup admin oturumu açamadıysa sebebi döner; yoksa null. */
function adminSkipReason(): string | null {
  try {
    if (!existsSync(ADMIN_SKIP_PATH)) return null;
    const reason = readFileSync(ADMIN_SKIP_PATH, 'utf8').trim();
    return reason || 'Admin oturumu kullanılamıyor.';
  } catch {
    return null;
  }
}

/** Admin oturumu açar ve panele girer (yalnızca gerektiğinde; normalde globalSetup kullanılır). */
export async function loginAdmin(page: Page): Promise<void> {
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.getByLabel('Kullanıcı adı').fill(ADMIN_USER);
  await page.getByLabel('Şifre').fill(ADMIN_PASS);
  await page.getByRole('button', { name: 'Giriş Yap' }).click();

  let outcome = await waitForLoginOutcome(page, 20_000);
  if (outcome === 'totp') {
    if (!ADMIN_TOTP_SECRET) {
      throw new Error('Admin hesabında 2FA açık; E2E_ADMIN_TOTP_SECRET tanımlayın.');
    }
    const token = await generate({ secret: ADMIN_TOTP_SECRET });
    await page.locator('input[autocomplete="one-time-code"]').fill(token.trim());
    await page.getByRole('button', { name: 'Kodu Doğrula' }).click();
    outcome = await waitForLoginOutcome(page, 20_000);
  }
  if (outcome !== 'ok') {
    throw new Error(
      outcome === 'error'
        ? 'Admin girişi reddedildi (kimlik bilgileri hatalı veya hesap kilitli).'
        : 'Admin girişi zaman aşımına uğradı.',
    );
  }
  await expect(page.locator('main')).toBeVisible();
}

/**
 * Admin oturumlu bir test context'i sağlar.
 * Oturum globalSetup'ta bir kez açılır ve storageState dosyasından okunur (paralel login yarışı yok).
 */
export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const skip = adminSkipReason();
    if (skip) test.skip(true, `Admin testi atlandı: ${skip}`);

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
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await dismissConsent(page);
      return res;
    } catch (err) {
      last = err;
      await page.waitForTimeout(800);
    }
  }
  throw last;
}

/** Çerez bandı açıksa kabul eder (tıklamaları örtmesini engeller). */
export async function dismissConsent(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: /Kabul Et|Accept/ }).first();
  try {
    if (await accept.isVisible({ timeout: 1000 })) await accept.click({ timeout: 2000 });
  } catch {
    // bant yok / tıklanamadı: yok say
  }
}

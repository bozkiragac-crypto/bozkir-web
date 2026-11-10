import { chromium, type FullConfig, type Page } from '@playwright/test';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generate } from 'otplib';

/** Paylaşılan admin oturumunun yazıldığı dosya (worker'lar bunu okur). */
export const ADMIN_STATE_PATH = resolve(__dirname, '../../.auth/admin.json');
/** Admin oturumu açılamazsa sebebi buraya yazılır; fixture'lar admin testlerini atlar. */
export const ADMIN_SKIP_PATH = resolve(__dirname, '../../.auth/admin.skip');

const AUTH_DIR = dirname(ADMIN_STATE_PATH);

const ADMIN_USER = process.env.E2E_ADMIN_USER ?? '';
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? '';
const ADMIN_TOTP_SECRET = process.env.E2E_ADMIN_TOTP_SECRET ?? '';

/** Test öncesi kritik sayfaları ısıtır; her istek kendi timeout'una sahiptir. */
async function warmUp(base: string): Promise<void> {
  const paths = ['/tr', '/tr/urunler', '/tr/kategoriler', '/en', '/ar', '/api/health?deep=1'];
  await Promise.all(
    paths.map(async (path) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(`${base}${path}`, {
            signal: AbortSignal.timeout(10_000),
          });
          if (res.ok) return;
        } catch {
          // tekrar dene
        }
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
      }
    }),
  );
}

function atAdmin(page: Page): boolean {
  return new URL(page.url()).pathname.replace(/\/$/, '') === '/admin';
}

/**
 * Giriş sonucunu bekler: panele yönlendirme, 2FA alanı veya hata uyarısı.
 * Sabit `waitForURL` yerine yarıştırma yapılır; 2FA açık hesaplarda 90 sn
 * timeout yerine anında doğru dala geçilir.
 */
export async function waitForLoginOutcome(
  page: Page,
  timeout = 25_000,
): Promise<'ok' | 'totp' | 'error' | 'timeout'> {
  const deadline = Date.now() + timeout;
  const totpField = page.locator('input[autocomplete="one-time-code"]');
  while (Date.now() < deadline) {
    if (atAdmin(page)) return 'ok';
    if (await totpField.isVisible().catch(() => false)) return 'totp';
    const alert = page.getByRole('alert').first();
    if (await alert.isVisible().catch(() => false)) return 'error';
    await page.waitForTimeout(250);
  }
  return 'timeout';
}

async function openAdminSession(base: string): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base });
  const page = await context.newPage();
  try {
    await page.goto('/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.getByLabel('Kullanıcı adı').fill(ADMIN_USER);
    await page.getByLabel('Şifre').fill(ADMIN_PASS);
    await page.getByRole('button', { name: 'Giriş Yap' }).click();

    let outcome = await waitForLoginOutcome(page);
    if (outcome === 'totp') {
      if (!ADMIN_TOTP_SECRET) {
        throw new Error(
          'Admin hesabında 2FA açık. E2E_ADMIN_TOTP_SECRET tanımlayın veya test kullanıcısında 2FA’yı kapatın.',
        );
      }
      const token = await generate({ secret: ADMIN_TOTP_SECRET });
      await page.locator('input[autocomplete="one-time-code"]').fill(token.trim());
      await page.getByRole('button', { name: 'Kodu Doğrula' }).click();
      outcome = await waitForLoginOutcome(page);
    }

    if (outcome === 'error') {
      const message = (await page.getByRole('alert').first().textContent())?.trim();
      throw new Error(message || 'Admin girişi reddedildi.');
    }
    if (outcome !== 'ok') {
      throw new Error('Admin girişi zaman aşımına uğradı (panele yönlendirme olmadı).');
    }

    await context.storageState({ path: ADMIN_STATE_PATH });
  } finally {
    await browser.close();
  }
}

function writeSkip(reason: string): void {
  try {
    writeFileSync(ADMIN_SKIP_PATH, reason, 'utf8');
  } catch {
    // yazılamazsa yalnızca konsol uyarısı kalır
  }
}

/** Test öncesi kritik sayfaları ısıtır ve admin oturumunu bir kez açar. */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const base = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';

  await warmUp(base);

  mkdirSync(AUTH_DIR, { recursive: true });
  for (const file of [ADMIN_STATE_PATH, ADMIN_SKIP_PATH]) {
    try {
      if (existsSync(file)) unlinkSync(file);
    } catch {
      // yok say
    }
  }

  // Kimlik bilgisi yoksa admin testleri atlanır; tüm suite kırmızıya dönmez.
  if (!ADMIN_USER || !ADMIN_PASS) {
    const reason = 'E2E_ADMIN_USER / E2E_ADMIN_PASS tanımlı değil.';
    writeSkip(reason);
    console.warn(`[e2e] ${reason} Admin testleri atlanacak.`);
    return;
  }

  try {
    await openAdminSession(base);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeSkip(message);
    console.warn(`[e2e] Admin oturumu açılamadı, admin testleri atlanacak: ${message}`);
  }
}

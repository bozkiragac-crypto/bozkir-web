import { chromium, type FullConfig } from '@playwright/test';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'bozkir';
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? 'Bozkir.1905';

/** Paylaşılan admin oturumunun yazıldığı dosya (worker'lar bunu okur). */
export const ADMIN_STATE_PATH = resolve(__dirname, '../../.auth/admin.json');

/** Test öncesi kritik sayfaları ısıtır ve admin oturumunu bir kez açar. */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const base = config.projects[0]?.use?.baseURL ?? 'http://localhost:3000';

  const paths = ['/tr', '/tr/urunler', '/tr/kategoriler', '/en', '/ar', '/api/health?deep=1'];
  await Promise.all(
    paths.map(async (p) => {
      for (let i = 0; i < 3; i++) {
        try {
          const res = await fetch(`${base}${p}`);
          if (res.ok) return;
        } catch {
          // tekrar dene
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }),
  );

  // Admin oturumunu bir kez aç ve storageState'i diske yaz (paralel login yarışını önler).
  mkdirSync(dirname(ADMIN_STATE_PATH), { recursive: true });
  if (existsSync(ADMIN_STATE_PATH)) {
    try {
      unlinkSync(ADMIN_STATE_PATH);
    } catch {
      // yok say
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base });
  const page = await context.newPage();
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(`${base}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.getByLabel('Kullanıcı adı').fill(ADMIN_USER);
      await page.getByLabel('Şifre').fill(ADMIN_PASS);
      await page.getByRole('button', { name: 'Giriş Yap' }).click();
      await page.waitForURL('**/admin', { timeout: 30_000, waitUntil: 'domcontentloaded' });
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(1000);
    }
  }
  if (lastError) {
    await browser.close();
    throw lastError;
  }
  await context.storageState({ path: ADMIN_STATE_PATH });
  await browser.close();
}

import { defineConfig, devices } from '@playwright/test';

/**
 * E2E testleri. Varsayılan olarak çalışan bir sunucuya (BASE_URL) karşı koşar.
 * - Yerelde: `docker compose up -d` sonrası `BASE_URL=http://localhost`.
 * - CI'da: server otomatik başlatılır (webServer) veya BASE_URL verilir.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const CI = !!process.env.CI;

// Worker sayısı CPU yarısı (varsayılan 4) olduğunda, Docker yığını da aynı anda
// çalışıyorsa tarayıcı + SSR sunucusu birlikte zaman aşımına düşüyor.
// Varsayılanı 2'ye sabitliyoruz; `E2E_WORKERS=1` ile darboğaz makinelerde düşürülebilir.
const WORKERS = process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : CI ? 1 : 2;

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // SSR + veritabanı içeren sayfalar için 30s yetersiz kalabiliyor.
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: CI,
  // Ortam kaynaklı (zaman aşımı) flake'leri bir kez tekrar dener; gerçek
  // assertion hataları yine de kırmızı kalır.
  retries: CI ? 2 : 1,
  workers: WORKERS,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  // BASE_URL verilmediyse ve CI'da değilsek local dev sunucusunu kullan.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !CI,
        timeout: 120_000,
      },
});

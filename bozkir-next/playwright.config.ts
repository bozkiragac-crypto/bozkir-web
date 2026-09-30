import { defineConfig, devices } from '@playwright/test';

/**
 * E2E testleri. Varsayılan olarak çalışan bir sunucuya (BASE_URL) karşı koşar.
 * - Yerelde: `docker compose up -d` sonrası `BASE_URL=http://localhost`.
 * - CI'da: server otomatik başlatılır (webServer) veya BASE_URL verilir.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
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
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});

import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `upgrade-insecure-requests` yalnızca gerçek HTTPS dağıtımında anlamlıdır.
 * Yerel Docker E2E'si HTTP üzerinden koşar; bu direktif Next RSC prefetch
 * isteklerini `https://localhost`'a yükseltir, bağlantı reddedilir ve admin
 * client navigation (router.push / waitForURL) flake olur.
 */
type HeaderRule = { key: string; value: string };
type RouteHeaders = { headers: HeaderRule[] };

async function cspFor(siteUrl: string | undefined): Promise<string> {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);

  // @ts-expect-error next.config.mjs düz JavaScript; tip tanımı yok.
  const { default: config } = (await import('../../next.config.mjs')) as {
    default: { headers?: () => Promise<RouteHeaders[]> | RouteHeaders[] };
  };
  const routes = (await config.headers?.()) ?? [];
  const csp = routes
    .flatMap((route) => route.headers)
    .find((rule) => rule.key === 'Content-Security-Policy');
  expect(csp, 'Content-Security-Policy başlığı tanımlı olmalı').toBeDefined();
  return String(csp?.value ?? '');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('CSP upgrade-insecure-requests', () => {
  it('HTTP localhost dağıtımında direktifi eklemez', async () => {
    const csp = await cspFor('http://localhost');
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('HTTPS prod dağıtımında direktifi korur', async () => {
    const csp = await cspFor('https://www.bozkiragac.com');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('SITE_URL tanımlı değilse prod varsayımıyla direktifi korur', async () => {
    expect(await cspFor(undefined)).toContain('upgrade-insecure-requests');
  });
});

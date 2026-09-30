import type { FullConfig } from '@playwright/test';

/**
 * Test öncesi kritik sayfaları ısıtır (on-demand ISR/ilk üretim gecikmesini emer).
 */
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
}

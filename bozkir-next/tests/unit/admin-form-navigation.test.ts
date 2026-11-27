import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Next.js 15'te `router.refresh()` mevcut rotayı yeniler. `router.push()` /
 * `router.replace()` hemen ardından çağrılırsa yeni rotaya geçiş iptal
 * edilebiliyor: işlem tamamlanır, kullanıcı aynı sayfada kalır.
 * Geçiş sonrası refresh gereksizdir; hedef sayfa zaten sunucudan çizilir.
 */
const navigations = [
  'src/components/admin/CampaignForm.tsx',
  'src/components/admin/CategoryForm.tsx',
  'src/components/admin/BrandForm.tsx',
  'src/components/admin/CatalogForm.tsx',
  'src/components/admin/ProductForm.tsx',
  'src/components/admin/LoginForm.tsx',
  'src/components/admin/AdminTabGuard.tsx',
];

describe('admin navigation', () => {
  it.each(navigations)('%s geçiş sonrası refresh çağırmaz', (file) => {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    expect(source).not.toMatch(
      /router\.(?:push|replace)\([^;]*\);\s*router\.refresh\(\);/,
    );
  });
});

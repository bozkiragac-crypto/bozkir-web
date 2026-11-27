import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Kanonik alan adı tutarlılığı.
 *
 * README, .env.production.example ve docker-compose varsayılanı www kullanırken
 * go-live.sh ve PRODUCTION.md apex domain kullanıyordu. Bu test, dağıtım
 * sırasında üretilen SITE_URL'in canonical/OG/hreflang ile aynı adresi
 * kullanmasını korur.
 */
const read = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('production canonical URL', () => {
  it('go-live.sh www canonical SITE_URL üretir', () => {
    expect(read('deploy/go-live.sh')).toContain('SITE_URL=https://www.${DOMAIN}');
  });

  it('PRODUCTION.md www canonical SITE_URL önerir', () => {
    expect(read('deploy/PRODUCTION.md')).toContain(
      'SITE_URL=https://www.bozkiragac.com',
    );
  });

  it('docker-compose varsayılanı www canonical kullanır', () => {
    expect(read('docker-compose.yml')).toContain(
      'SITE_URL:-https://www.bozkiragac.com',
    );
  });
});

#!/usr/bin/env node
/**
 * E2E testleri için deterministik veri tohumu (CI).
 *
 * CI'daki postgres servisi boş başlar; ürün/kategori verisi olmadan ürüne bağlı
 * E2E testleri (liste, arama, kategori, admin ürün kodu, favori, OG görseli)
 * kaçınılmaz olarak düşer. Bu script minimal bir veri kümesi ekler.
 *
 * Idempotent: `products` tablosunda kayıt varsa dokunmaz (yerel/geliştirme
 * verisi ezilmez). Zorlamak için: `node scripts/seed-e2e.mjs --force`
 * (önce `code LIKE 'E2E-%'` olan satırları siler).
 *
 * Kategori eşlemesi `src/lib/data/category-key.ts` ile aynıdır:
 *   'MDF LAM'   -> mdflam
 *   'LAK PANEL' -> lak-panel
 *   'PVC KENAR' -> pvc-kenar-bant
 */
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const file of ['.env.local', '.env']) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

if (!process.env.DATABASE_URL) {
  console.error('HATA: DATABASE_URL tanımlı değil.');
  process.exit(1);
}

const force = process.argv.includes('--force');

// [code, name, cat, face, img]
// Görseller repodaki statik dosyalardır (public/images/gallery); böylece S3
// yapılandırılmadan (CI) da next/image başarıyla yükler ve galeri/lightbox
// butonları güvenilir biçimde render edilir.
// Not: her kategori en az 2 ürün içerir; böylece ürün detayındaki "Benzer
// Ürünler" bölümü hangi ürün ilk sırada gelirse gelsin dolu olur.
const PRODUCTS = [
  ['PVC', 'PVC Kenar Bant', 'PVC KENAR', 'PVC', '/images/gallery/SGL_849.webp'],
  ['PVC-02', 'PVC Kenar Bant Beyaz', 'PVC KENAR', 'PVC', '/images/gallery/SGL_859.webp'],
  ['LAK-01', 'Lak Panel Bej', 'LAK PANEL', 'Lak', '/images/gallery/milano.webp'],
  ['LAK-02', 'Lak Panel Beyaz', 'LAK PANEL', 'Lak', '/images/gallery/dubai.webp'],
  ['MDF-01', 'MDF Lam Panel Bej', 'MDF LAM', 'Bej', '/images/gallery/SGL_02B.webp'],
  ['MDF-02', 'MDF Lam Panel Antrasit', 'MDF LAM', 'Antrasit', '/images/gallery/SGL_297.webp'],
  ['SUNTA-01', 'Suntalam Panel Beyaz', 'SUNTALAM', 'Beyaz', '/images/gallery/lima.webp'],
  ['SUNTA-02', 'Suntalam Panel Kestane', 'SUNTALAM', 'Kestane', '/images/gallery/odessa.webp'],
];

const SEED_CODES = PRODUCTS.map((p) => p[0]);

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows } = await client.query('SELECT count(*)::int AS n FROM products');
  const count = rows[0]?.n ?? 0;

  if (count > 0 && !force) {
    console.log(`E2E seed atlandı: products tablosunda ${count} kayıt var (--force ile zorlanır).`);
  } else {
    await client.query('BEGIN');
    if (force) await client.query('DELETE FROM products WHERE code = ANY($1)', [SEED_CODES]);

    for (const [code, name, cat, face, img] of PRODUCTS) {
      await client.query(
        `INSERT INTO products (code, name, cat, face, img, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT DO NOTHING`,
        [code, name, cat, face, img],
      );
    }
    await client.query('COMMIT');
    console.log(`✓ E2E seed: ${PRODUCTS.length} ürün eklendi.`);
  }
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('HATA:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

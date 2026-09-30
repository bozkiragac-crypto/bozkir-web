#!/usr/bin/env node
/**
 * Görselsiz ürünlere kapak görseli aktarır.
 * Kaynak: kök `img/` klasörü (dosya adı = ürün kodu/isim).
 * Hedef: S3 `products/<id>/0.<ext>` + products.img güncellemesi.
 *
 * Kullanım: node scripts/import-missing-images.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const ROOT = path.resolve(import.meta.dirname, '..');
const IMG_DIR = path.resolve(ROOT, '..', 'img');

for (const file of ['.env.local', '.env']) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const dryRun = process.argv.includes('--dry-run');
const BUCKET = process.env.S3_BUCKET || 'bozkir-media';

const MIME = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.avif': 'image/avif',
};

const norm = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** Tutkal ürünleri için anahtar kelime eşlemesi. */
function keywordStem(name) {
  const n = String(name ?? '').toLowerCase();
  if (n.includes('betamelt') && n.includes('522')) return 'BETAMELT_522';
  if (n.includes('betamelt') && n.includes('539')) return 'BETAMELT_539';
  if (n.includes('d3')) return 'D3_SUPER';
  if (n.includes('wg90')) return 'WG90_MAVI';
  return null;
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY || 'any', secretAccessKey: process.env.S3_SECRET_KEY || 'any' },
});

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const rows = (await client.query("select id, code, name, cat from products where img is null or img = '' order by code")).rows;

const files = fs.readdirSync(IMG_DIR).filter((f) => MIME[path.extname(f).toLowerCase()]);
const byStem = new Map();
for (const f of files) byStem.set(norm(path.basename(f, path.extname(f))), f);

console.log(`Görselsiz ürün: ${rows.length} | img/ dosyası: ${files.length}\n`);

let matched = 0;
let uploaded = 0;
const unmatched = [];

for (const row of rows) {
  const candidates = [keywordStem(row.name), norm(row.code), norm(row.name)].filter(Boolean);
  const file = candidates.map((c) => byStem.get(c)).find(Boolean);
  if (!file) {
    unmatched.push(`${row.code} (${row.name})`);
    continue;
  }
  matched++;
  const ext = path.extname(file).toLowerCase();
  const key = `products/${row.id}/0${ext}`;
  console.log(`${dryRun ? '[dry] ' : ''}${row.code.padEnd(34)} <- ${file}  -> ${key}`);
  if (dryRun) continue;

  const body = fs.readFileSync(path.join(IMG_DIR, file));
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: MIME[ext] || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  await client.query('update products set img = $1 where id = $2', [key, row.id]);
  uploaded++;
}

await client.end();
console.log(`\nEşleşen: ${matched}/${rows.length} | Yüklenen: ${uploaded}`);
if (unmatched.length) console.log('Eşleşmeyen:\n  - ' + unmatched.join('\n  - '));

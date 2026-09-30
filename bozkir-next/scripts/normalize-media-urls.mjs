#!/usr/bin/env node
/**
 * Tek seferlik göç: DB'deki mutlak görsel URL'lerini nesne ANAHTARINA indirger.
 *   http://localhost:8333/bozkir-media/products/<id>/1.webp  ->  products/<id>/1.webp
 * `data:` (base64) ve harici URL'ler olduğu gibi korunur.
 *
 * Kullanım:  node scripts/normalize-media-urls.mjs [--dry-run]
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

const dryRun = process.argv.includes('--dry-run');
const BUCKET = process.env.S3_BUCKET || 'bozkir-media';
const PUBLIC_BASE = (process.env.S3_PUBLIC_BASE_URL || '/media').replace(/\/$/, '');

function toKey(value) {
  const v = String(value ?? '').trim();
  if (!v || v.startsWith('data:')) return v;
  const prefixes = [PUBLIC_BASE ? `${PUBLIC_BASE}/` : '', '/media/', `/${BUCKET}/`];
  for (const p of prefixes) {
    if (p && v.startsWith(p)) return v.slice(p.length);
  }
  const bucketPrefix = `/${BUCKET}/`;
  const idx = v.indexOf(bucketPrefix);
  if (idx !== -1) return v.slice(idx + bucketPrefix.length);
  try {
    const u = new URL(v);
    const parts = u.pathname.split('/').filter(Boolean);
    const bi = parts.indexOf(BUCKET);
    if (bi >= 0 && bi < parts.length - 1) return parts.slice(bi + 1).join('/');
  } catch {
    // göreli/yabancı — korunur
  }
  return v;
}

function parseList(raw) {
  const t = String(raw ?? '').trim();
  if (!t) return [];
  if (t.startsWith('[')) {
    try {
      const arr = JSON.parse(t);
      return Array.isArray(arr) ? arr.map((x) => String(x).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  if (t.startsWith('data:')) return [t];
  return t.split(',').map((s) => s.trim()).filter(Boolean);
}

function serialize(list) {
  const clean = list.map((v) => v.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

function normalizeList(raw) {
  const list = parseList(raw).map(toKey);
  return serialize(list);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let changed = 0;

const products = await client.query('select id, img from products where img is not null');
for (const row of products.rows) {
  const next = normalizeList(row.img);
  if (next !== row.img) {
    changed++;
    if (!dryRun) await client.query('update products set img = $1 where id = $2', [next, row.id]);
  }
}

for (const [table, column] of [['campaigns', 'image_url'], ['content_items', 'image_url']]) {
  const rows = await client.query(`select id, ${column} as value from ${table} where ${column} is not null`);
  for (const row of rows.rows) {
    const next = toKey(row.value);
    if (next && next !== row.value) {
      changed++;
      if (!dryRun) await client.query(`update ${table} set ${column} = $1 where id = $2`, [next, row.id]);
    }
  }
}

await client.end();
console.log(`${dryRun ? '[dry-run] ' : ''}Güncellenen satır: ${changed}`);

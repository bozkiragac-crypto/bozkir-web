#!/usr/bin/env node
/**
 * Medya bütünlük denetimi: DB'de referans verilen her görsel gerçekten
 * depoda (SeaweedFS S3) var mı? Yayına almadan önce kırık görsel olmadığını
 * doğrulamak için kullanılır.
 *
 * Kullanım:
 *   node scripts/audit-media.mjs            # eksik referansları listele (hata durumunda exit 1)
 *   node scripts/audit-media.mjs --orphans  # depoda kullanılmayan dosyaları da raporla
 */
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const ROOT = path.resolve(import.meta.dirname, '..');

for (const file of ['.env.local', '.env']) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const showOrphans = process.argv.includes('--orphans');
const BUCKET = process.env.S3_BUCKET || 'bozkir-media';
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL || '/media';

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'any',
    secretAccessKey: process.env.S3_SECRET_KEY || 'any',
  },
});

/** DB'deki değer: anahtar, `/media/...` yolu veya mutlak URL olabilir. */
function toKey(raw) {
  let v = String(raw ?? '').trim();
  if (!v) return '';
  if (v.startsWith(`${PUBLIC_BASE}/`)) v = v.slice(PUBLIC_BASE.length + 1);
  else if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      const base = new URL(PUBLIC_BASE, 'http://x');
      v = u.pathname.startsWith(base.pathname) ? u.pathname.slice(base.pathname.length + 1) : u.pathname.slice(1);
    } catch {
      return '';
    }
  } else {
    v = v.replace(/^\/+/, '');
  }
  return v;
}

/** `img` alanı virgülle ayrılmış liste veya JSON dizisi olabilir. */
function parseField(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((x) => String(x)).filter(Boolean);
    } catch {
      /* aşağıdaki virgül ayrımına düş */
    }
  }
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const [products, campaigns] = await Promise.all([
  client.query('select id, cat, code, name, img from products'),
  client.query('select id, title, img from campaigns').catch(() => ({ rows: [] })),
]);

// Depodaki tüm anahtarlar (tek seferde listele).
const keys = new Set();
let token;
do {
  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token, MaxKeys: 1000 }),
  );
  for (const o of res.Contents ?? []) if (o.Key) keys.add(o.Key);
  token = res.IsTruncated ? res.NextContinuationToken : undefined;
} while (token);

const referenced = new Set();
const missing = [];

const check = (owner, label, raw) => {
  for (const item of parseField(raw)) {
    const key = toKey(item);
    if (!key) continue;
    referenced.add(key);
    if (!keys.has(key)) missing.push({ owner, label, key, url: `${PUBLIC_BASE}/${key}` });
  }
};

for (const p of products.rows) check('product', `${p.cat} / ${p.code} / ${p.name}`, p.img);
for (const c of campaigns.rows) check('campaign', c.title ?? c.id, c.img);

console.log(`Depo: ${BUCKET} — ${keys.size} nesne`);
console.log(`Ürün: ${products.rows.length}, kampanya: ${campaigns.rows.length}`);

if (missing.length) {
  console.error(`\n❌ Eksik görsel referansı: ${missing.length}`);
  for (const m of missing) console.error(`   [${m.owner}] ${m.label}\n      anahtar: ${m.key}\n      url:     ${m.url}`);
} else {
  console.log('\n✅ Tüm görsel referansları depoda mevcut.');
}

if (showOrphans) {
  const orphans = [...keys].filter((k) => !referenced.has(k) && !k.endsWith('/'));
  console.log(`\nℹ️  Kullanılmayan dosya: ${orphans.length}`);
  for (const k of orphans.slice(0, 100)) console.log(`   ${k}`);
  if (orphans.length > 100) console.log(`   ... ve ${orphans.length - 100} tane daha`);
}

await client.end();
process.exit(missing.length ? 1 : 0);
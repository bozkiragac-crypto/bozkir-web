#!/usr/bin/env node
/**
 * Admin hesabı oluşturur/günceller (kullanıcı adı tabanlı).
 * Kullanım: node scripts/seed-admin.mjs [kullaniciadi] [sifre] [ad]
 * Env: DATABASE_URL
 */
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
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

const username = (process.argv[2] ?? process.env.ADMIN_USERNAME ?? 'bozkir').trim().toLowerCase();
const password = process.argv[3] ?? process.env.ADMIN_SEED_PASSWORD;
const name = process.argv[4] ?? username;

if (!process.env.DATABASE_URL) {
  console.error('HATA: DATABASE_URL tanımlı değil.');
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error('HATA: 8+ karakterlik şifre verin: node scripts/seed-admin.mjs bozkir "Sifre123!"');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const hash = await bcrypt.hash(password, 10);

await client.query(
  `INSERT INTO admin_users (username, name, role, is_active, password_hash)
   VALUES ($1, $2, 'owner', TRUE, $3)
   ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
  [username, name, hash],
);
await client.end();
console.log(`✓ admin: ${username}`);
console.log('Giriş: /admin/login');

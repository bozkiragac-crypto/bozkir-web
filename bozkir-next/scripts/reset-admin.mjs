#!/usr/bin/env node
/**
 * Admin hesaplarını sıfırlar: tüm kullanıcıları siler ve tek bir "sahip" oluşturur.
 * Kullanım: node scripts/reset-admin.mjs [kullaniciadi] [sifre] [ad]
 * Varsayılan: bozkir / Bozkir.1905 / Bozkır
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

const username = (process.argv[2] ?? 'bozkir').trim().toLowerCase();
const password = process.argv[3] ?? 'Bozkir.1905';
const name = process.argv[4] ?? 'Bozkır';

if (!process.env.DATABASE_URL) {
  console.error('HATA: DATABASE_URL tanımlı değil.');
  process.exit(1);
}
if (!username || !password || password.length < 8) {
  console.error('HATA: Kullanıcı adı ve en az 8 karakterlik şifre gerekli.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const removed = await client.query('DELETE FROM admin_users');
const hash = await bcrypt.hash(password, 10);
await client.query(
  `INSERT INTO admin_users (username, name, role, is_active, password_hash)
   VALUES ($1, $2, 'owner', TRUE, $3)`,
  [username, name, hash],
);
await client.end();

console.log(`Silinen hesap: ${removed.rowCount}`);
console.log(`✓ Oluşturuldu: ${username} (sahip, şifre: ${password})`);

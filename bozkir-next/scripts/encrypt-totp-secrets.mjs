#!/usr/bin/env node
/**
 * Mevcut düz metin TOTP secret'larını AES-256-GCM ile şifreler.
 * İdempotenttir: v1: ile başlayan kayıtları atlar.
 *
 * Kullanım:
 *   node scripts/encrypt-totp-secrets.mjs
 *
 * Env: DATABASE_URL
 *      TOTP_ENCRYPTION_KEY (önerilen; base64 veya 64 karakter hex)
 *      veya AUTH_SECRET (fallback)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
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

const PREFIX = 'v1:';

function key() {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (raw) {
    const value = /^[0-9a-f]{64}$/i.test(raw)
      ? Buffer.from(raw, 'hex')
      : Buffer.from(raw, 'base64');
    if (value.length !== 32) throw new Error('TOTP_ENCRYPTION_KEY 32 byte olmalı.');
    return value;
  }
  if (!process.env.AUTH_SECRET) {
    throw new Error('TOTP_ENCRYPTION_KEY veya AUTH_SECRET gerekli.');
  }
  return createHash('sha256').update(process.env.AUTH_SECRET).digest();
}

function encrypt(secret, encryptionKey) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
}

if (!process.env.DATABASE_URL) {
  console.error('HATA: DATABASE_URL tanımlı değil.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const encryptionKey = key();
  const rows = await client.query(
    `SELECT id, username, totp_secret FROM admin_users
     WHERE totp_secret IS NOT NULL AND totp_secret <> ''`,
  );
  let updated = 0;
  for (const row of rows.rows) {
    if (row.totp_secret.startsWith(PREFIX)) continue;
    await client.query(`UPDATE admin_users SET totp_secret = $2 WHERE id = $1`, [
      row.id,
      encrypt(row.totp_secret, encryptionKey),
    ]);
    updated++;
    console.log(`✓ ${row.username ?? row.id}`);
  }
  console.log(`Tamamlandı: ${updated} secret şifrelendi, ${rows.rowCount - updated} zaten şifreliydi.`);
} finally {
  await client.end();
}

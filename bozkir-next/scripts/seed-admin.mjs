#!/usr/bin/env node
/**
 * Admin hesabı oluşturur; mevcut hesaba varsayılan olarak DOKUNMAZ.
 *
 * Kullanım:
 *   node scripts/seed-admin.mjs [kullaniciadi] [sifre] [ad] [--update] [--reset-2fa]
 *   node scripts/seed-admin.mjs bozkir --password-stdin --update --yes < sifre.txt
 *
 * Davranış:
 *   - Hesap yoksa owner olarak oluşturur.
 *   - Hesap varsa hiçbir şey yapmaz (entrypoint her restart'ta şifreyi ezmez).
 *   - --update verilirse şifreyi günceller, kilit/deneme sayacını sıfırlar.
 *   - --reset-2fa verilirse TOTP secret'ını temizler.
 *
 * Env: DATABASE_URL, ADMIN_SEED_USERNAME, ADMIN_SEED_PASSWORD
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

const argv = process.argv.slice(2);
const positional = [];
const flags = { update: false, reset2fa: false, passwordStdin: false, yes: false };
for (const arg of argv) {
  if (arg === '--update') flags.update = true;
  else if (arg === '--reset-2fa') flags.reset2fa = true;
  else if (arg === '--password-stdin') flags.passwordStdin = true;
  else if (arg === '--yes' || arg === '-y') flags.yes = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(
      'Kullanım: node scripts/seed-admin.mjs <kullanıcı> <şifre> [ad] [--update] [--reset-2fa]',
    );
    process.exit(0);
  } else if (arg.startsWith('--')) {
    console.error(`HATA: Bilinmeyen seçenek: ${arg}`);
    process.exit(1);
  } else positional.push(arg);
}

const username = (
  positional[0] ??
  process.env.ADMIN_SEED_USERNAME ??
  process.env.ADMIN_USERNAME ??
  'bozkir'
)
  .trim()
  .toLowerCase();
let password = positional[1] ?? process.env.ADMIN_SEED_PASSWORD ?? '';
const name = positional[2] ?? username;

if (flags.passwordStdin) {
  password = fs.readFileSync(0, 'utf8').replace(/\r?\n$/, '');
  flags.yes = true;
}
if (!process.env.DATABASE_URL) {
  console.error('HATA: DATABASE_URL tanımlı değil.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const existing = await client.query(
    `SELECT id, username, is_active FROM admin_users WHERE lower(username) = $1 LIMIT 1`,
    [username],
  );
  const target = existing.rows[0];

  // Mevcut hesap + açık güncelleme yok: hiçbir şey yazma.
  if (target && !flags.update && !flags.reset2fa) {
    console.log(`✓ admin mevcut, korunuyor: ${username}`);
    process.exit(0);
  }

  if (!password) {
    console.error('HATA: Şifre gerekli (argüman, ADMIN_SEED_PASSWORD veya --password-stdin).');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('HATA: Şifre en az 8 karakter olmalı.');
    process.exit(1);
  }
  if (/^(bozkir|password|12345678|bozkir\.1905)$/i.test(password)) {
    console.error('HATA: Bilinen/zayıf bir şifre kullanılamaz.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  await client.query('BEGIN');
  let userId = target?.id;
  if (target) {
    if (!flags.yes && !process.stdin.isTTY) {
      console.error('HATA: Mevcut hesabı güncellemek için --yes zorunlu.');
      process.exit(1);
    }
    await client.query(
      `UPDATE admin_users
       SET password_hash = $2,
           failed_attempts = 0,
           locked_until = NULL,
           totp_secret = CASE WHEN $3 THEN NULL ELSE totp_secret END,
           totp_enabled = CASE WHEN $3 THEN FALSE ELSE totp_enabled END
       WHERE id = $1`,
      [target.id, hash, flags.reset2fa],
    );
  } else {
    const inserted = await client.query(
      `INSERT INTO admin_users (username, name, role, is_active, password_hash)
       VALUES ($1, $2, 'owner', TRUE, $3)
       RETURNING id`,
      [username, name, hash],
    );
    userId = inserted.rows[0].id;
  }

  if (userId) {
    await client.query(
      `INSERT INTO activity_log (user_id, username, action, entity, entity_id, summary)
       VALUES ($1::uuid, $2, 'update', 'auth', $1::text, $3)`,
      [
        userId,
        username,
        target
          ? `CLI seed ile şifre güncellendi${flags.reset2fa ? ' (2FA temizlendi)' : ''}`
          : 'CLI seed ile owner oluşturuldu',
      ],
    );
  }
  await client.query('COMMIT');

  console.log(`✓ admin: ${username} (${target ? 'güncellendi' : 'oluşturuldu'})`);
  if (flags.reset2fa) console.log('✓ 2FA sıfırlandı.');
  console.log('Giriş: /admin/login');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('HATA:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}

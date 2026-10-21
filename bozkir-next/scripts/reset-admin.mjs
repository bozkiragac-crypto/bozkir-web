#!/usr/bin/env node
/**
 * Yönetici şifresini hedefli olarak sıfırlar.
 *
 * Kullanım:
 *   node scripts/reset-admin.mjs --user bozkir --password-stdin --yes
 *   node scripts/reset-admin.mjs --user bozkir --password "YeniSifre!" --yes
 *   node scripts/reset-admin.mjs --list
 *
 * Seçenekler:
 *   --user <ad>          Kullanıcı adı veya e-posta (zorunlu)
 *   --password <şifre>   Yeni şifre (veya --password-stdin)
 *   --password-stdin     Şifreyi stdin'den oku (shell geçmişine yazmaz)
 *   --name <ad>          --create ile oluşturulacak hesabın adı
 *   --email <e-posta>    --create ile oluşturulacak hesabın e-postası
 *   --create             Kullanıcı yoksa owner olarak oluştur
 *   --reset-2fa          2FA secret'ını temizle (cihaz kaybı)
 *   --activate           Pasif hesabı yeniden aktifleştir
 *   --yes                Onay sormadan devam et (TTY yoksa zorunlu)
 *   --dry-run            Hiçbir şey yazmadan planı göster
 *   --list               Yönetici hesaplarını listele
 *
 * Eski kullanım (uyumluluk): node scripts/reset-admin.mjs <kullanıcı> <şifre> [ad]
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

const opts = {
  user: '',
  password: '',
  passwordStdin: false,
  name: '',
  email: '',
  create: false,
  reset2fa: false,
  activate: false,
  yes: false,
  dryRun: false,
  list: false,
};

const positional = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  const next = () => {
    const value = argv[++i];
    if (!value || value.startsWith('--')) {
      console.error(`HATA: ${arg} için değer gerekli.`);
      process.exit(1);
    }
    return value;
  };
  if (arg === '--user' || arg === '-u') opts.user = next();
  else if (arg === '--password' || arg === '-p') opts.password = next();
  else if (arg === '--password-stdin') opts.passwordStdin = true;
  else if (arg === '--name') opts.name = next();
  else if (arg === '--email') opts.email = next();
  else if (arg === '--create') opts.create = true;
  else if (arg === '--reset-2fa') opts.reset2fa = true;
  else if (arg === '--activate') opts.activate = true;
  else if (arg === '--yes' || arg === '-y') opts.yes = true;
  else if (arg === '--dry-run') opts.dryRun = true;
  else if (arg === '--list') opts.list = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(
      'Kullanım: node scripts/reset-admin.mjs --user <ad> --password-stdin --yes [--create] [--reset-2fa]',
    );
    process.exit(0);
  } else if (arg.startsWith('--')) {
    console.error(`HATA: Bilinmeyen seçenek: ${arg}`);
    process.exit(1);
  } else {
    positional.push(arg);
  }
}

// Eski positional kullanımı destekle.
if (!opts.user && positional[0]) opts.user = positional[0];
if (!opts.password && !opts.passwordStdin && positional[1]) opts.password = positional[1];
if (!opts.name && positional[2]) opts.name = positional[2];

if (!process.env.DATABASE_URL) {
  console.error('HATA: DATABASE_URL tanımlı değil.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  if (opts.list) {
    const rows = await client.query(
      `SELECT username, email, role, is_active, totp_enabled, locked_until
       FROM admin_users ORDER BY username`,
    );
    if (rows.rowCount === 0) {
      console.log('Yönetici hesabı yok.');
    } else {
      for (const row of rows.rows) {
        const lock =
          row.locked_until && new Date(row.locked_until).getTime() > Date.now()
            ? ' KİLİTLİ'
            : '';
        console.log(
          `${row.username} | ${row.role} | ${row.is_active ? 'aktif' : 'pasif'} | 2FA: ${
            row.totp_enabled ? 'açık' : 'kapalı'
          }${lock}${row.email ? ` | ${row.email}` : ''}`,
        );
      }
    }
    process.exit(0);
  }

  const identifier = opts.user.trim().toLowerCase();
  if (!identifier) {
    console.error('HATA: --user <kullanıcı veya e-posta> zorunlu.');
    process.exit(1);
  }

  if (opts.passwordStdin) {
    if (opts.password) {
      console.error('HATA: --password ve --password-stdin birlikte kullanılamaz.');
      process.exit(1);
    }
    opts.password = fs.readFileSync(0, 'utf8').replace(/\r?\n$/, '');
    // stdin tüketildiği için etkileşimli onay verilemez.
    opts.yes = true;
  }

  if (!opts.password) {
    console.error('HATA: --password veya --password-stdin zorunlu.');
    process.exit(1);
  }
  if (opts.password.length < 8) {
    console.error('HATA: Şifre en az 8 karakter olmalı.');
    process.exit(1);
  }
  if (/^(bozkir|password|12345678|bozkir\.1905)$/i.test(opts.password)) {
    console.error('HATA: Bilinen/zayıf bir şifre kullanılamaz.');
    process.exit(1);
  }

  const found = await client.query(
    `SELECT id, username, email, role, is_active, totp_enabled
     FROM admin_users
     WHERE lower(username) = $1 OR lower(email) = $1
     LIMIT 1`,
    [identifier],
  );
  const target = found.rows[0];

  if (!target && !opts.create) {
    console.error(
      `HATA: "${identifier}" bulunamadı. Yeni owner oluşturmak için --create ekleyin.`,
    );
    const rows = await client.query('SELECT username FROM admin_users ORDER BY username');
    if (rows.rowCount) {
      console.error(`Mevcut hesaplar: ${rows.rows.map((r) => r.username).join(', ')}`);
    }
    process.exit(1);
  }

  if (!opts.yes) {
    if (!process.stdin.isTTY) {
      console.error('HATA: Etkileşimsiz ortamda --yes zorunlu.');
      process.exit(1);
    }
    const readline = await import('node:readline/promises');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(
      `${target ? target.username : identifier} hesabının şifresi sıfırlanacak. Devam? (evet/hayır): `,
    );
    rl.close();
    if (!/^e(vet)?$/i.test(answer.trim())) {
      console.log('İptal edildi.');
      process.exit(1);
    }
  }

  const plan = {
    action: target ? 'update' : 'create',
    user: target?.username ?? identifier,
    reset2fa: opts.reset2fa,
    activate: opts.activate,
  };
  if (opts.dryRun) {
    console.log('DRY RUN:', plan);
    process.exit(0);
  }

  const hash = await bcrypt.hash(opts.password, 10);
  await client.query('BEGIN');
  let userId = target?.id;
  if (target) {
    await client.query(
      `UPDATE admin_users
       SET password_hash = $2,
           failed_attempts = 0,
           locked_until = NULL,
           is_active = CASE WHEN $3 THEN TRUE ELSE is_active END,
           totp_secret = CASE WHEN $4 THEN NULL ELSE totp_secret END,
           totp_enabled = CASE WHEN $4 THEN FALSE ELSE totp_enabled END
       WHERE id = $1`,
      [target.id, hash, opts.activate, opts.reset2fa],
    );
  } else {
    const inserted = await client.query(
      `INSERT INTO admin_users (username, email, name, role, is_active, password_hash)
       VALUES ($1, $2, $3, 'owner', TRUE, $4)
       RETURNING id`,
      [
        identifier,
        opts.email.trim().toLowerCase() || null,
        opts.name.trim() || identifier,
        hash,
      ],
    );
    userId = inserted.rows[0].id;
  }

  if (userId) {
    await client.query(
      `INSERT INTO activity_log (user_id, username, action, entity, entity_id, summary)
       VALUES ($1::uuid, $2, 'update', 'auth', $1::text, $3)`,
      [
        userId,
        target?.username ?? identifier,
        `CLI ile şifre sıfırlandı${opts.reset2fa ? ' (2FA temizlendi)' : ''}`,
      ],
    );
  }
  await client.query('COMMIT');

  console.log(`✓ ${target ? 'Güncellendi' : 'Oluşturuldu'}: ${target?.username ?? identifier}`);
  if (opts.reset2fa) console.log('✓ 2FA sıfırlandı.');
  if (opts.activate) console.log('✓ Hesap aktifleştirildi.');
  console.log('Giriş: /admin/login');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('HATA:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}

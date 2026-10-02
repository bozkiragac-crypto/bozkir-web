#!/usr/bin/env node
/**
 * İdempotent şema migrasyonu (mevcut veriyi korur).
 * Kullanım: node scripts/db-migrate.mjs
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

const statements = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  // products.is_active
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,

  // ürün SEO alanları (admin'den düzenlenebilir)
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT`,

  // admin_users genişletme
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS username TEXT`,
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner'`,
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`,
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`,
  `ALTER TABLE admin_users ALTER COLUMN email DROP NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key ON admin_users (username)`,
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_secret TEXT`,
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE`,
  // giriş güvenliği: başarısız deneme + hesap kilitleme
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0`,
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`,

  // site ayarları
  `CREATE TABLE IF NOT EXISTS site_settings (
     key TEXT PRIMARY KEY,
     value JSONB NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // aktivite kaydı
  `CREATE TABLE IF NOT EXISTS activity_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID,
     username TEXT,
     action TEXT NOT NULL,
     entity TEXT,
     entity_id TEXT,
     summary TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log (created_at DESC)`,

  // tekliflerde ürün bağlantısı
  `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS product_id TEXT`,
  `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS product_slug TEXT`,
  `CREATE INDEX IF NOT EXISTS quote_requests_product_idx ON quote_requests (product_slug)`,
  // çok dilli ürün metinleri (EN/AR); boşsa Türkçeye düşer
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en TEXT`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ar TEXT`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS cat_en TEXT`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS cat_ar TEXT`,

  // çok dilli kampanya metinleri
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS title_en TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS title_ar TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description_en TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description_ar TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS link_label_en TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS link_label_ar TEXT`,

  // çok dilli içerik blokları
  `ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS title_en TEXT`,
  `ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS title_ar TEXT`,
  `ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS subtitle_en TEXT`,
  `ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS subtitle_ar TEXT`,
  `ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS body_en TEXT`,
  `ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS body_ar TEXT`,

  // çok dilli içerik öğeleri
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS title_en TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS title_ar TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS description_en TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS description_ar TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS tag_en TEXT`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS tag_ar TEXT`,

  // kataloglar (admin CRUD)
  `CREATE TABLE IF NOT EXISTS catalogs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug TEXT NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     year INT,
     cover TEXT,
     pdf_url TEXT,
     page_count INT,
     sort_order INT NOT NULL DEFAULT 0,
     is_active BOOLEAN NOT NULL DEFAULT TRUE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     title_en TEXT,
     title_ar TEXT,
     description_en TEXT,
     description_ar TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS catalogs_sort_idx ON catalogs (sort_order)`,

  // teklif eki gerçek yükleme (S3 anahtarı)
  `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS attachment_key TEXT`,

  // teklif yönetimi: durum + dahili not
  `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'`,
  `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS internal_note TEXT`,
  `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  `CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON quote_requests (status)`,
  `CREATE INDEX IF NOT EXISTS quote_requests_created_idx ON quote_requests (created_at DESC)`,

  // kategoriler (admin CRUD)
  `CREATE TABLE IF NOT EXISTS categories (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug TEXT NOT NULL,
     name TEXT NOT NULL,
     name_en TEXT,
     name_ar TEXT,
     description TEXT,
     description_en TEXT,
     description_ar TEXT,
     short_description TEXT,
     short_description_en TEXT,
     short_description_ar TEXT,
     thumbnail TEXT,
     hero_image TEXT,
     featured BOOLEAN NOT NULL DEFAULT FALSE,
     sort_order INT NOT NULL DEFAULT 0,
     is_active BOOLEAN NOT NULL DEFAULT TRUE,
     seo_title TEXT,
     seo_description TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS categories_sort_idx ON categories (sort_order)`,

  // markalar / bayilikler (admin CRUD)
  `CREATE TABLE IF NOT EXISTS brands (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     logo TEXT,
     url TEXT,
     category TEXT,
     category_en TEXT,
     category_ar TEXT,
     description TEXT,
     sort_order INT NOT NULL DEFAULT 0,
     is_active BOOLEAN NOT NULL DEFAULT TRUE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS brands_sort_idx ON brands (sort_order)`,

  // Performans indeksleri (idempotent).
  `CREATE INDEX IF NOT EXISTS products_active_created_idx ON products (is_active, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS products_code_idx ON products (code)`,
  `CREATE INDEX IF NOT EXISTS quote_requests_created_idx ON quote_requests (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS campaigns_active_window_idx ON campaigns (is_active, starts_at, ends_at)`,
  `CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug)`,
  `CREATE INDEX IF NOT EXISTS catalogs_slug_idx ON catalogs (slug)`,
  `CREATE INDEX IF NOT EXISTS content_blocks_active_sort_idx ON content_blocks (is_active, sort_order)`,
];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
let n = 0;
for (const sql of statements) {
  try {
    await client.query(sql);
    n++;
  } catch (e) {
    console.error('HATA:', sql.split('\n')[0], '->', e.message);
    process.exitCode = 1;
  }
}
await client.end();
console.log(`Migrasyon tamam: ${n}/${statements.length} ifade uygulandı.`);

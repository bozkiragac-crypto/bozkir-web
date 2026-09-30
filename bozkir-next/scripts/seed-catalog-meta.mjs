#!/usr/bin/env node
/**
 * Kategorileri ve markaları fallback verisinden DB'ye tohumlar (idempotent).
 * Mevcut kayıtları (aynı slug) atlar.
 * Kullanım: node scripts/seed-catalog-meta.mjs
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

/** Kategori tohumları (fallback ile eşdeğer). */
const categories = [
  { slug: 'mdflam', name: 'MDF Lam', name_en: 'MDF Lam', name_ar: 'MDF لام', short: 'Dekor kaplı MDF panel', featured: true, sort: 1, thumb: '/images/categories/mdflam.webp' },
  { slug: 'lak-panel', name: 'Lak Panel', name_en: 'Lacquer Panel', name_ar: 'لوح دهان', short: 'Parlak lake yüzey', featured: true, sort: 2, thumb: '/images/categories/lakpanel.webp' },
  { slug: 'kapi-panel', name: 'Kapı Panel', name_en: 'Door Panel', name_ar: 'لوح باب', short: 'Kapı üretim panelleri', featured: true, sort: 3, thumb: '/images/categories/kapi.webp' },
  { slug: 'suntalam', name: 'Suntalam', name_en: 'Sunta Lam', name_ar: 'سونتا لام', short: 'Kaplamalı yonga levha', featured: true, sort: 4, thumb: '/images/categories/suntalam.webp' },
  { slug: 'sunta', name: 'Sunta', name_en: 'Chipboard', name_ar: 'خشب مضغوط', short: 'Yonga levha', featured: true, sort: 5, thumb: '/images/categories/sunta.webp' },
  { slug: 'mdf', name: 'MDF', name_en: 'Raw MDF', name_ar: 'MDF خام', short: 'Orta yoğunluklu lif levha', featured: true, sort: 6, thumb: '/images/categories/mdf.webp' },
  { slug: 'duvar-profili', name: 'Duvar Profili', name_en: 'Wall Profile', name_ar: 'بروفايل جدار', short: 'Dekoratif duvar profilleri', featured: true, sort: 7, thumb: '/images/categories/duvar-profili.webp' },
  { slug: 'pvc-kenar-bant', name: 'PVC Kenar Bant', name_en: 'PVC Edge Banding', name_ar: 'شريط حواف PVC', short: 'PVC kenar bandı', featured: true, sort: 8, thumb: '/images/categories/kenarbant.webp' },
  { slug: 'kaplamali-mdf', name: 'Kaplamalı MDF', name_en: 'Veneered MDF', name_ar: 'MDF مكسو', short: 'Kaplama uygulanmış MDF', featured: false, sort: 9, thumb: '/images/categories/kaplamali-mdf.webp' },
  { slug: 'masif-panel', name: 'Masif Panel', name_en: 'Solid Panel', name_ar: 'لوح صلب', short: 'Masif ahşap panel', featured: false, sort: 10, thumb: '/images/categories/masifpanel.webp' },
  { slug: 'pervaz', name: 'Pervaz', name_en: 'Frame & Trim', name_ar: 'إطار وحافة', short: 'Pervaz malzemeleri', featured: false, sort: 11, thumb: '/images/categories/pervaz.webp' },
  { slug: 'tutkal', name: 'Tutkal', name_en: 'Adhesives', name_ar: 'مواد لاصقة', short: 'Apel yapıştırıcı', featured: true, sort: 12, thumb: '/images/categories/tutkal.webp' },
  { slug: 'osb', name: 'OSB', name_en: 'OSB Board', name_ar: 'لوح OSB', short: 'Yönlendirilmiş yonga levha', featured: false, sort: 13, thumb: '/images/categories/osb.webp' },
];

const brands = [
  { name: 'Yıldız Entegre', logo: '/images/brands/yildiz-entegre.webp', url: 'https://www.yildizentegre.com', category: 'MDF / Yonga Levha', category_en: 'MDF / Particleboard', category_ar: 'MDF / ألواح الجسيمات', sort: 1 },
  { name: 'Teverpan MDF', logo: '/images/brands/teverpan.webp', url: 'http://www.teverpan.com.tr', category: 'MDF Levha', category_en: 'MDF Board', category_ar: 'ألواح MDF', sort: 2 },
  { name: 'Apel Tutkal', logo: '/images/brands/apel-tutkal.webp', url: 'https://www.betakimya.com.tr', category: 'Yapıştırıcı', category_en: 'Adhesive', category_ar: 'مواد لاصقة', sort: 3 },
  { name: 'HSÇ Plastik', logo: '/images/brands/hsc-plastik.webp', url: 'https://hscplastik.com', category: 'PVC Kenar Bant', category_en: 'PVC Edge Banding', category_ar: 'شريط حواف PVC', sort: 4 },
  { name: 'AGT', logo: '/images/brands/agt.webp', url: 'https://www.agt.com.tr/', category: 'MDF / Panel', category_en: 'MDF / Panel', category_ar: 'MDF / ألواح', sort: 5 },
];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let c = 0;
for (const cat of categories) {
  const exists = await client.query('SELECT 1 FROM categories WHERE slug = $1', [cat.slug]);
  if (exists.rowCount) continue;
  await client.query(
    `INSERT INTO categories (slug, name, name_en, name_ar, short_description, featured, sort_order, is_active, thumbnail, hero_image)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$8)`,
    [cat.slug, cat.name, cat.name_en, cat.name_ar, cat.short, cat.featured, cat.sort, cat.thumb],
  );
  c++;
}

let b = 0;
for (const br of brands) {
  const exists = await client.query('SELECT 1 FROM brands WHERE name = $1', [br.name]);
  if (exists.rowCount) continue;
  await client.query(
    `INSERT INTO brands (name, logo, url, category, category_en, category_ar, sort_order, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
    [br.name, br.logo, br.url, br.category, br.category_en, br.category_ar, br.sort],
  );
  b++;
}

await client.end();
console.log(`Kategori eklendi: ${c}, marka eklendi: ${b}.`);

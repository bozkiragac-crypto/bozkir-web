-- Bozkır Ağaç — PostgreSQL şeması (Docker initdb)
-- docker/initdb/01-schema.sql dosyası olarak Postgres ilk açılışta çalıştırır.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ürünler
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    cat TEXT NOT NULL,
    face TEXT,
    img TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name_en TEXT,
    name_ar TEXT,
    cat_en TEXT,
    cat_ar TEXT
);
CREATE INDEX IF NOT EXISTS products_cat_idx ON products (cat);
CREATE INDEX IF NOT EXISTS products_created_idx ON products (created_at DESC);

-- Kampanyalar
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    link_label TEXT DEFAULT 'İncele',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title_en TEXT,
    title_ar TEXT,
    description_en TEXT,
    description_ar TEXT,
    link_label_en TEXT,
    link_label_ar TEXT
);

-- İçerik blokları
CREATE TABLE IF NOT EXISTS content_blocks (
    key TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    body TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title_en TEXT,
    title_ar TEXT,
    subtitle_en TEXT,
    subtitle_ar TEXT,
    body_en TEXT,
    body_ar TEXT
);

-- İçerik öğeleri
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_key TEXT NOT NULL REFERENCES content_blocks(key) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    tag TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title_en TEXT,
    title_ar TEXT,
    description_en TEXT,
    description_ar TEXT,
    tag_en TEXT,
    tag_ar TEXT
);
CREATE INDEX IF NOT EXISTS content_items_block_idx ON content_items (block_key, sort_order);

-- Kataloglar (admin CRUD)
CREATE TABLE IF NOT EXISTS catalogs (
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
);
CREATE INDEX IF NOT EXISTS catalogs_sort_idx ON catalogs (sort_order);

-- Kategoriler (admin CRUD)
CREATE TABLE IF NOT EXISTS categories (
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
);
CREATE INDEX IF NOT EXISTS categories_sort_idx ON categories (sort_order);

-- Markalar / bayilikler (admin CRUD)
CREATE TABLE IF NOT EXISTS brands (
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
);
CREATE INDEX IF NOT EXISTS brands_sort_idx ON brands (sort_order);

-- Yöneticiler (yalnızca admin girişi; müşteri hesabı yok)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'owner',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site ayarları (anahtar/değer)
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aktivite kaydı
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    username TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log (created_at DESC);

-- Teklif talepleri
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    company TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    product TEXT,
  product_id TEXT,
  product_slug TEXT,
    quantity TEXT,
    dimensions TEXT,
    note TEXT,
    attachment_name TEXT,
    attachment_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Varsayılan içerik blokları
INSERT INTO content_blocks (key, title, subtitle, is_active, sort_order) VALUES
    ('gallery',      'Malzeme Vitrini',       'Gerçek yüzeyler, gerçek renkler', TRUE, 1),
    ('guide',        'Malzeme Rehberi',       'Hangi iş için hangi panel?',      TRUE, 2),
    ('applications', 'Uygulama Alanları',     'Panelin işe dönüştüğü yerler',    TRUE, 3),
    ('process',      'Nasıl Çalışıyoruz',     'Talepten teslimata',              TRUE, 4),
    ('faq',          'Sıkça Sorulan Sorular', '',                                TRUE, 5)
ON CONFLICT (key) DO NOTHING;

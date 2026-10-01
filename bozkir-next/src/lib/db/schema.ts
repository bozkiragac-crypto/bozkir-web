import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    cat: text('cat').notNull(),
    face: text('face'),
    img: text('img'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Çok dilli altyapı: TR zorunlu, EN/AR çevirileri opsiyonel (yoksa TR'ye düşer).
    nameEn: text('name_en'),
    nameAr: text('name_ar'),
    catEn: text('cat_en'),
    catAr: text('cat_ar'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
  },
  (t) => [index('products_cat_idx').on(t.cat), index('products_created_idx').on(t.createdAt)],
);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  linkLabel: text('link_label').default('İncele'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Çok dilli alanlar (opsiyonel); boşsa Türkçeye düşer.
  titleEn: text('title_en'),
  titleAr: text('title_ar'),
  descriptionEn: text('description_en'),
  descriptionAr: text('description_ar'),
  linkLabelEn: text('link_label_en'),
  linkLabelAr: text('link_label_ar'),
});

export const contentBlocks = pgTable('content_blocks', {
  key: text('key').primaryKey(),
  title: text('title'),
  subtitle: text('subtitle'),
  body: text('body'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  titleEn: text('title_en'),
  titleAr: text('title_ar'),
  subtitleEn: text('subtitle_en'),
  subtitleAr: text('subtitle_ar'),
  bodyEn: text('body_en'),
  bodyAr: text('body_ar'),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    nameEn: text('name_en'),
    nameAr: text('name_ar'),
    description: text('description'),
    descriptionEn: text('description_en'),
    descriptionAr: text('description_ar'),
    shortDescription: text('short_description'),
    shortDescriptionEn: text('short_description_en'),
    shortDescriptionAr: text('short_description_ar'),
    thumbnail: text('thumbnail'),
    heroImage: text('hero_image'),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('categories_sort_idx').on(t.sortOrder)],
);

export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    logo: text('logo'),
    url: text('url'),
    category: text('category'),
    categoryEn: text('category_en'),
    categoryAr: text('category_ar'),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('brands_sort_idx').on(t.sortOrder)],
);

export const catalogs = pgTable(
  'catalogs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    year: integer('year'),
    cover: text('cover'),
    pdfUrl: text('pdf_url'),
    pageCount: integer('page_count'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    titleEn: text('title_en'),
    titleAr: text('title_ar'),
    descriptionEn: text('description_en'),
    descriptionAr: text('description_ar'),
  },
  (t) => [index('catalogs_sort_idx').on(t.sortOrder)],
);

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockKey: text('block_key')
      .notNull()
      .references(() => contentBlocks.key, { onDelete: 'cascade' }),
    title: text('title'),
    description: text('description'),
    imageUrl: text('image_url'),
    linkUrl: text('link_url'),
    tag: text('tag'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    titleEn: text('title_en'),
    titleAr: text('title_ar'),
    descriptionEn: text('description_en'),
    descriptionAr: text('description_ar'),
    tagEn: text('tag_en'),
    tagAr: text('tag_ar'),
  },
  (t) => [index('content_items_block_idx').on(t.blockKey, t.sortOrder)],
);

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').unique(),
  email: text('email').unique(),
  name: text('name'),
  role: text('role').notNull().default('owner'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  passwordHash: text('password_hash').notNull(),
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  company: text('company'),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  product: text('product'),
  productId: text('product_id'),
  productSlug: text('product_slug'),
  quantity: text('quantity'),
  dimensions: text('dimensions'),
  note: text('note'),
  attachmentName: text('attachment_name'),
  attachmentKey: text('attachment_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    username: text('username'),
    action: text('action').notNull(),
    entity: text('entity'),
    entityId: text('entity_id'),
    summary: text('summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('activity_log_created_idx').on(t.createdAt)],
);

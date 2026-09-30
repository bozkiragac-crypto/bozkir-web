'use server';

import bcrypt from 'bcryptjs';
import { eq, inArray, or } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { adminUsers, brands, campaigns, catalogs, categories, contentBlocks, contentItems, products, quoteRequests } from '@/lib/db/schema';
import { createSession, destroySession } from '@/lib/auth/session';
import { parseImageField, serializeImageField, validateUpload, MAX_PDF_MB, ALLOWED_PDF_MIME } from '@/lib/media';
import { DATA_TAGS } from '@/lib/data/tags';
import { deleteObject, objectKeyFromUrl, putObject, publicUrl, toObjectKey } from '@/lib/storage/s3';
import { logActivity, requireAdminUser } from '@/lib/admin/guard';
import { parseCsv } from '@/lib/csv';
import { slugify } from '@/lib/slug';

function extOf(name: string, type: string) {
  const fromName = name.split('.').pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|avif|pdf)$/.test(fromName)) return fromName === 'jpg' ? 'jpg' : fromName;
  if (type === 'application/pdf') return 'pdf';
  if (type === 'image/png') return 'png';
  if (type === 'image/avif') return 'avif';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

/** Veri önbelleğini (etiket) ve ilgili sayfaları tazeler. */
async function flushSiteCaches() {
  revalidateTag(DATA_TAGS.products);
  revalidateTag(DATA_TAGS.content);
  revalidateTag(DATA_TAGS.campaigns);
  revalidateTag(DATA_TAGS.catalogs);
  revalidatePath('/', 'layout');
  revalidatePath('/urunler', 'layout');
  revalidatePath('/kategoriler', 'layout');
}

/* ---------------- Auth ---------------- */

export async function signIn(identifier: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = identifier.trim().toLowerCase();
  if (!id || !password) return { ok: false, error: 'Kullanıcı adı ve şifre gerekli.' };

  const rows = await db
    .select()
    .from(adminUsers)
    .where(or(eq(adminUsers.username, id), eq(adminUsers.email, id)))
    .limit(1);
  const user = rows[0];
  if (!user || !user.isActive) return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' };

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createSession({
    sub: user.id,
    username: user.username ?? '',
    email: user.email ?? undefined,
    name: user.name ?? user.username ?? 'Yönetici',
    role: user.role ?? 'owner',
    admin: true,
  });
  await logActivity(user, 'login', 'auth', user.id, 'Giriş yapıldı');
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const user = await requireAdminUser().catch(() => null);
  if (user) await logActivity(user, 'logout', 'auth', user.id, 'Çıkış yapıldı');
  await destroySession();
}

/* ---------------- Medya (SeaweedFS / S3) ---------------- */

const MEDIA_FOLDERS = ['products', 'campaigns', 'content', 'catalogs', 'quotes'] as const;
type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export async function uploadMedia(
  formData: FormData,
  folder: MediaFolder,
  ownerId?: string,
): Promise<{ url?: string; error?: string }> {
  const admin = await requireAdminUser();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Dosya seçilmedi.' };

  const isPdf = ALLOWED_PDF_MIME.includes(file.type);
  if (isPdf) {
    if (file.size > MAX_PDF_MB * 1024 * 1024) return { error: `PDF en fazla ${MAX_PDF_MB} MB olabilir.` };
  } else {
    const invalid = validateUpload(file);
    if (invalid) return { error: invalid };
  }

  if (!MEDIA_FOLDERS.includes(folder)) return { error: 'Geçersiz klasör.' };

  const key = `${folder}/${ownerId ?? 'drafts'}/${crypto.randomUUID()}.${extOf(file.name, file.type)}`;
  try {
    await putObject(key, Buffer.from(await file.arrayBuffer()), file.type || 'image/jpeg');
  } catch {
    return { error: 'Yükleme başarısız. Depolama bağlantısını kontrol edin.' };
  }
  await logActivity(admin, 'upload', 'media', key, `Yüklendi: ${key}`);
  return { url: publicUrl(key) };
}

export async function deleteMedia(url: string): Promise<void> {
  const admin = await requireAdminUser();
  const key = toObjectKey(url);
  if (key) {
    await deleteObject(key);
    await logActivity(admin, 'delete', 'media', key, `Silindi: ${key}`);
  }
}

/** Medya kütüphanesinden nesne anahtarıyla siler. */
export async function deleteMediaKey(key: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const objectKey = toObjectKey(key) ?? key;
  if (!objectKey) return { ok: false, error: 'Geçersiz anahtar.' };
  await deleteObject(objectKey);
  await logActivity(admin, 'delete', 'media', objectKey, `Silindi: ${objectKey}`);
  revalidatePath('/admin/medya');
  return { ok: true };
}

/* ---------------- Ürünler ---------------- */

export interface ProductInput {
  id?: string;
  name: string;
  code: string;
  cat: string;
  face: string;
  images: string[];
  isActive?: boolean;
  /** Çok dilli alanlar (opsiyonel); boşsa TR değeri kullanılır. */
  nameEn?: string;
  nameAr?: string;
  catEn?: string;
  catAr?: string;
}

export async function saveProduct(input: ProductInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const name = input.name.trim();
  const code = input.code.trim();
  const cat = input.cat.trim();
  if (!name || !code || !cat) return { ok: false, error: 'Ad, kod ve kategori zorunludur.' };

  const keys = input.images.map((u) => objectKeyFromUrl(u) ?? u.trim()).filter(Boolean);
  const img = serializeImageField(keys);
  const isActive = input.isActive ?? true;
  const nameEn = input.nameEn?.trim() || null;
  const nameAr = input.nameAr?.trim() || null;
  const catEn = input.catEn?.trim() || null;
  const catAr = input.catAr?.trim() || null;

  if (input.id) {
    const prev = await db.select({ img: products.img }).from(products).where(eq(products.id, input.id)).limit(1);
    const oldKeys = parseImageField(prev[0]?.img ?? '')
      .map((v) => toObjectKey(v))
      .filter((k): k is string => !!k);
    const next = new Set(keys);

    await db
      .update(products)
      .set({
        name,
        code,
        cat,
        face: input.face.trim() || null,
        img,
        isActive,
        nameEn,
        nameAr,
        catEn,
        catAr,
      })
      .where(eq(products.id, input.id));

    for (const key of oldKeys) {
      if (!next.has(key)) await deleteObject(key);
    }
    await logActivity(admin, 'update', 'product', input.id, `Ürün güncellendi: ${name}`);
    await flushSiteCaches();
    return { ok: true, id: input.id };
  }

  const inserted = await db
    .insert(products)
    .values({
      name,
      code,
      cat,
      face: input.face.trim() || null,
      img,
      isActive,
      nameEn,
      nameAr,
      catEn,
      catAr,
    })
    .returning({ id: products.id });

  await logActivity(admin, 'create', 'product', inserted[0]?.id, `Ürün eklendi: ${name}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const prev = await db.select({ img: products.img, name: products.name }).from(products).where(eq(products.id, id)).limit(1);
  const keys = parseImageField(prev[0]?.img ?? '')
    .map((v) => toObjectKey(v))
    .filter((k): k is string => !!k);

  await db.delete(products).where(eq(products.id, id));
  for (const key of keys) await deleteObject(key);

  await logActivity(admin, 'delete', 'product', id, `Ürün silindi: ${prev[0]?.name ?? id}`);
  await flushSiteCaches();
  return { ok: true };
}

export async function setProductActive(id: string, isActive: boolean): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  await db.update(products).set({ isActive }).where(eq(products.id, id));
  await logActivity(admin, 'update', 'product', id, isActive ? 'Ürün aktifleştirildi' : 'Ürün pasifleştirildi');
  await flushSiteCaches();
  return { ok: true };
}

export async function bulkDeleteProducts(ids: string[]): Promise<{ ok: boolean; deleted: number }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db || ids.length === 0) return { ok: false, deleted: 0 };

  const rows = await db.select({ img: products.img }).from(products).where(inArray(products.id, ids));
  for (const row of rows) {
    const keys = parseImageField(row.img ?? '')
      .map((v) => toObjectKey(v))
      .filter((k): k is string => !!k);
    for (const key of keys) await deleteObject(key);
  }
  await db.delete(products).where(inArray(products.id, ids));
  await logActivity(admin, 'delete', 'product', undefined, `${ids.length} ürün toplu silindi`);
  await flushSiteCaches();
  return { ok: true, deleted: ids.length };
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  created: number;
  updated: number;
}

/** CSV içe aktarma: `code` ile eşleşeni günceller, yoksa ekler. */
export async function importProductsCsv(csv: string, dryRun = true): Promise<ImportResult> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.', created: 0, updated: 0 };

  const rows = parseCsv(csv);
  if (rows.length === 0) return { ok: false, error: 'Dosya boş.', created: 0, updated: 0 };

  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iCode = idx('code');
  const iName = idx('name');
  const iCat = idx('cat');
  if (iCode === -1 || iName === -1 || iCat === -1) {
    return { ok: false, error: 'CSV başlığı code,name,cat en az içermeli.', created: 0, updated: 0 };
  }
  const iFace = idx('face');
  const iImg = idx('img');
  const iActive = idx('is_active');
  const iNameEn = idx('name_en');
  const iNameAr = idx('name_ar');
  const iCatEn = idx('cat_en');
  const iCatAr = idx('cat_ar');

  let created = 0;
  let updated = 0;

  for (const r of rows.slice(1)) {
    const code = (r[iCode] ?? '').trim();
    const name = (r[iName] ?? '').trim();
    const cat = (r[iCat] ?? '').trim();
    if (!code || !name || !cat) continue;

    const face = iFace >= 0 ? (r[iFace] ?? '').trim() || null : null;
    const imgRaw = iImg >= 0 ? (r[iImg] ?? '').trim() : '';
    const img = imgRaw ? (objectKeyFromUrl(imgRaw) ?? imgRaw) : null;
    const isActive = iActive >= 0 ? !/^(0|false|pasif|hayir)$/i.test((r[iActive] ?? '').trim()) : true;
    const nameEn = iNameEn >= 0 ? (r[iNameEn] ?? '').trim() || null : null;
    const nameAr = iNameAr >= 0 ? (r[iNameAr] ?? '').trim() || null : null;
    const catEn = iCatEn >= 0 ? (r[iCatEn] ?? '').trim() || null : null;
    const catAr = iCatAr >= 0 ? (r[iCatAr] ?? '').trim() || null : null;

    const existing = await db.select({ id: products.id }).from(products).where(eq(products.code, code)).limit(1);
    if (existing[0]) {
      updated++;
      if (!dryRun) {
        await db
          .update(products)
          .set({ name, cat, face, img, isActive, nameEn, nameAr, catEn, catAr })
          .where(eq(products.id, existing[0].id));
      }
    } else {
      created++;
      if (!dryRun) {
        await db.insert(products).values({ code, name, cat, face, img, isActive, nameEn, nameAr, catEn, catAr });
      }
    }
  }

  if (!dryRun) {
    await logActivity(admin, 'update', 'product', undefined, `CSV içe aktarma: ${created} yeni, ${updated} güncelleme`);
    await flushSiteCaches();
  }
  return { ok: true, created, updated };
}

/* ---------------- Kampanyalar ---------------- */

export interface CampaignInput {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  linkLabelEn?: string;
  linkLabelAr?: string;
}

export async function saveCampaign(input: CampaignInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const title = input.title.trim();
  if (!title) return { ok: false, error: 'Başlık zorunludur.' };

  const imageInput = input.imageUrl.trim();
  const payload = {
    title,
    description: input.description.trim() || null,
    imageUrl: imageInput ? (objectKeyFromUrl(imageInput) ?? imageInput) : null,
    linkUrl: input.linkUrl.trim() || null,
    linkLabel: input.linkLabel.trim() || 'İncele',
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    isActive: input.isActive,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    titleEn: input.titleEn?.trim() || null,
    titleAr: input.titleAr?.trim() || null,
    descriptionEn: input.descriptionEn?.trim() || null,
    descriptionAr: input.descriptionAr?.trim() || null,
    linkLabelEn: input.linkLabelEn?.trim() || null,
    linkLabelAr: input.linkLabelAr?.trim() || null,
  };

  if (input.id) {
    await db.update(campaigns).set(payload).where(eq(campaigns.id, input.id));
    await logActivity(admin, 'update', 'campaign', input.id, `Kampanya güncellendi: ${title}`);
    await flushSiteCaches();
    return { ok: true, id: input.id };
  }

  const inserted = await db.insert(campaigns).values(payload).returning({ id: campaigns.id });
  await logActivity(admin, 'create', 'campaign', inserted[0]?.id, `Kampanya eklendi: ${title}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const prev = await db.select({ imageUrl: campaigns.imageUrl, title: campaigns.title }).from(campaigns).where(eq(campaigns.id, id)).limit(1);
  await db.delete(campaigns).where(eq(campaigns.id, id));

  const url = prev[0]?.imageUrl;
  const key = url ? toObjectKey(url) : null;
  if (key) await deleteObject(key);
  await logActivity(admin, 'delete', 'campaign', id, `Kampanya silindi: ${prev[0]?.title ?? id}`);
  await flushSiteCaches();
  return { ok: true };
}

/* ---------------- Kataloglar ---------------- */

export interface CatalogInput {
  id?: string;
  slug: string;
  title: string;
  description: string;
  year: number;
  cover: string;
  pdfUrl: string;
  pageCount: number;
  sortOrder: number;
  isActive: boolean;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

function slugifyCatalog(value: string): string {
  return slugify(value);
}

export async function saveCatalog(input: CatalogInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const title = input.title.trim();
  if (!title) return { ok: false, error: 'Başlık zorunludur.' };
  const slug = (input.slug.trim() || slugifyCatalog(title)) || crypto.randomUUID();

  const coverInput = input.cover.trim();
  const pdfInput = input.pdfUrl.trim();
  const payload = {
    slug,
    title,
    description: input.description.trim() || null,
    year: Number.isFinite(input.year) && input.year > 0 ? input.year : null,
    cover: coverInput ? (objectKeyFromUrl(coverInput) ?? coverInput) : null,
    pdfUrl: pdfInput ? (objectKeyFromUrl(pdfInput) ?? pdfInput) : null,
    pageCount: Number.isFinite(input.pageCount) && input.pageCount > 0 ? input.pageCount : null,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    isActive: input.isActive,
    titleEn: input.titleEn?.trim() || null,
    titleAr: input.titleAr?.trim() || null,
    descriptionEn: input.descriptionEn?.trim() || null,
    descriptionAr: input.descriptionAr?.trim() || null,
  };

  if (input.id) {
    await db.update(catalogs).set(payload).where(eq(catalogs.id, input.id));
    await logActivity(admin, 'update', 'catalog', input.id, `Katalog güncellendi: ${title}`);
    await flushSiteCaches();
    return { ok: true, id: input.id };
  }

  const inserted = await db.insert(catalogs).values(payload).returning({ id: catalogs.id });
  await logActivity(admin, 'create', 'catalog', inserted[0]?.id, `Katalog eklendi: ${title}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteCatalog(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const prev = await db.select({ cover: catalogs.cover, pdfUrl: catalogs.pdfUrl, title: catalogs.title }).from(catalogs).where(eq(catalogs.id, id)).limit(1);
  await db.delete(catalogs).where(eq(catalogs.id, id));

  for (const url of [prev[0]?.cover, prev[0]?.pdfUrl]) {
    const key = url ? toObjectKey(url) : null;
    if (key) await deleteObject(key);
  }
  await logActivity(admin, 'delete', 'catalog', id, `Katalog silindi: ${prev[0]?.title ?? id}`);
  await flushSiteCaches();
  return { ok: true };
}

/* ---------------- Kategoriler ---------------- */

export interface CategoryInput {
  id?: string;
  slug: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  description: string;
  descriptionEn?: string;
  descriptionAr?: string;
  shortDescription?: string;
  shortDescriptionEn?: string;
  shortDescriptionAr?: string;
  thumbnail: string;
  heroImage: string;
  featured: boolean;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export async function saveCategory(input: CategoryInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Ad zorunludur.' };
  const slug = (input.slug.trim() || slugify(name)) || crypto.randomUUID();
  const thumb = input.thumbnail.trim();
  const hero = input.heroImage.trim();

  const payload = {
    slug,
    name,
    nameEn: input.nameEn?.trim() || null,
    nameAr: input.nameAr?.trim() || null,
    description: input.description.trim() || null,
    descriptionEn: input.descriptionEn?.trim() || null,
    descriptionAr: input.descriptionAr?.trim() || null,
    shortDescription: input.shortDescription?.trim() || null,
    shortDescriptionEn: input.shortDescriptionEn?.trim() || null,
    shortDescriptionAr: input.shortDescriptionAr?.trim() || null,
    thumbnail: thumb ? (objectKeyFromUrl(thumb) ?? thumb) : null,
    heroImage: hero ? (objectKeyFromUrl(hero) ?? hero) : null,
    featured: input.featured,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    isActive: input.isActive,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
  };

  if (input.id) {
    await db.update(categories).set(payload).where(eq(categories.id, input.id));
    await logActivity(admin, 'update', 'category', input.id, `Kategori güncellendi: ${name}`);
    await flushSiteCaches();
    return { ok: true, id: input.id };
  }

  const inserted = await db.insert(categories).values(payload).returning({ id: categories.id });
  await logActivity(admin, 'create', 'category', inserted[0]?.id, `Kategori eklendi: ${name}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const prev = await db
    .select({ thumbnail: categories.thumbnail, heroImage: categories.heroImage, name: categories.name })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  await db.delete(categories).where(eq(categories.id, id));

  for (const url of [prev[0]?.thumbnail, prev[0]?.heroImage]) {
    const key = url ? toObjectKey(url) : null;
    if (key) await deleteObject(key);
  }
  await logActivity(admin, 'delete', 'category', id, `Kategori silindi: ${prev[0]?.name ?? id}`);
  await flushSiteCaches();
  return { ok: true };
}

/* ---------------- Markalar / Bayilikler ---------------- */

export interface BrandInput {
  id?: string;
  name: string;
  logo: string;
  url: string;
  category: string;
  categoryEn?: string;
  categoryAr?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export async function saveBrand(input: BrandInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Ad zorunludur.' };
  const logo = input.logo.trim();

  const payload = {
    name,
    logo: logo ? (objectKeyFromUrl(logo) ?? logo) : null,
    url: input.url.trim() || null,
    category: input.category.trim() || null,
    categoryEn: input.categoryEn?.trim() || null,
    categoryAr: input.categoryAr?.trim() || null,
    description: input.description?.trim() || null,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    isActive: input.isActive,
  };

  if (input.id) {
    await db.update(brands).set(payload).where(eq(brands.id, input.id));
    await logActivity(admin, 'update', 'brand', input.id, `Marka güncellendi: ${name}`);
    await flushSiteCaches();
    return { ok: true, id: input.id };
  }

  const inserted = await db.insert(brands).values(payload).returning({ id: brands.id });
  await logActivity(admin, 'create', 'brand', inserted[0]?.id, `Marka eklendi: ${name}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteBrand(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const prev = await db.select({ logo: brands.logo, name: brands.name }).from(brands).where(eq(brands.id, id)).limit(1);
  await db.delete(brands).where(eq(brands.id, id));

  const key = prev[0]?.logo ? toObjectKey(prev[0].logo) : null;
  if (key) await deleteObject(key);
  await logActivity(admin, 'delete', 'brand', id, `Marka silindi: ${prev[0]?.name ?? id}`);
  await flushSiteCaches();
  return { ok: true };
}

/* ---------------- İçerik ---------------- */
export interface ContentBlockInput {
  key: string;
  title: string;
  subtitle: string;
  body: string;
  isActive: boolean;
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
}

export async function saveContentBlock(input: ContentBlockInput): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const key = input.key.trim();
  if (!key) return { ok: false, error: 'Blok anahtarı zorunludur.' };

  const values = {
    key,
    title: input.title.trim() || null,
    subtitle: input.subtitle.trim() || null,
    body: input.body.trim() || null,
    isActive: input.isActive,
    titleEn: input.titleEn?.trim() || null,
    titleAr: input.titleAr?.trim() || null,
    subtitleEn: input.subtitleEn?.trim() || null,
    subtitleAr: input.subtitleAr?.trim() || null,
    bodyEn: input.bodyEn?.trim() || null,
    bodyAr: input.bodyAr?.trim() || null,
  };

  await db
    .insert(contentBlocks)
    .values({ ...values, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: contentBlocks.key,
      set: { ...values, updatedAt: new Date() },
    });

  await logActivity(admin, 'update', 'content', key, `İçerik bloğu güncellendi: ${key}`);
  await flushSiteCaches();
  return { ok: true };
}

export interface ContentItemInput {
  id?: string;
  blockKey: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  tag: string;
  sortOrder: number;
  isActive: boolean;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  tagEn?: string;
  tagAr?: string;
}

export async function saveContentItem(input: ContentItemInput): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const imageInput = input.imageUrl.trim();
  const payload = {
    blockKey: input.blockKey.trim(),
    title: input.title.trim() || null,
    description: input.description.trim() || null,
    imageUrl: imageInput ? (objectKeyFromUrl(imageInput) ?? imageInput) : null,
    linkUrl: input.linkUrl.trim() || null,
    tag: input.tag.trim() || null,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
    isActive: input.isActive,
    titleEn: input.titleEn?.trim() || null,
    titleAr: input.titleAr?.trim() || null,
    descriptionEn: input.descriptionEn?.trim() || null,
    descriptionAr: input.descriptionAr?.trim() || null,
    tagEn: input.tagEn?.trim() || null,
    tagAr: input.tagAr?.trim() || null,
  };

  if (input.id) {
    await db.update(contentItems).set(payload).where(eq(contentItems.id, input.id));
  } else {
    await db.insert(contentItems).values(payload);
  }

  await logActivity(admin, 'update', 'content', input.blockKey, `İçerik öğesi kaydedildi (${input.blockKey})`);
  await flushSiteCaches();
  return { ok: true };
}

export async function deleteContentItem(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const prev = await db.select({ imageUrl: contentItems.imageUrl }).from(contentItems).where(eq(contentItems.id, id)).limit(1);
  await db.delete(contentItems).where(eq(contentItems.id, id));

  const url = prev[0]?.imageUrl;
  const key = url ? toObjectKey(url) : null;
  if (key) await deleteObject(key);
  await logActivity(admin, 'delete', 'content', id, 'İçerik öğesi silindi');
  await flushSiteCaches();
  return { ok: true };
}

/* ---------------- Teklif talepleri ---------------- */

export async function deleteQuoteRequest(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  await db.delete(quoteRequests).where(eq(quoteRequests.id, id));
  await logActivity(admin, 'delete', 'quote', id, 'Teklif talebi silindi');
  revalidatePath('/admin/teklifler');
  return { ok: true };
}

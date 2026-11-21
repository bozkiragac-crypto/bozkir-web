'use server';

import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { and, eq, inArray, or } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db/client';
import {
  adminUsers,
  brands,
  campaigns,
  catalogs,
  categories,
  contentBlocks,
  contentItems,
  products,
  quoteRequests,
} from '@/lib/db/schema';
import { createSession, destroySession } from '@/lib/auth/session';
import {
  parseImageField,
  serializeImageField,
  validateUpload,
  validateImageSignature,
  MAX_PDF_MB,
  ALLOWED_PDF_MIME,
} from '@/lib/media';
import { optimizeImage } from '@/lib/image-optimize';
import { safeHref } from '@/lib/safe-url';
import { DATA_TAGS } from '@/lib/data/tags';
import {
  deleteObject,
  putObject,
  publicUrl,
  toObjectKey,
} from '@/lib/storage/s3';
import { logActivity, requireAdminUser, requireOwner } from '@/lib/admin/guard';
import { createTotpSecret, totpKeyUri, verifyTotp } from '@/lib/auth/totp';
import { decryptTotpSecret, encryptTotpSecret } from '@/lib/auth/totp-crypto';
import { parseCsv } from '@/lib/csv';
import { categorySlugOf } from '@/lib/data/category-key';
import { isQuoteStatus, type QuoteStatus } from '@/lib/quotes/status';
import { isRateLimited, pickClientIp } from '@/lib/ratelimit';
import { slugify } from '@/lib/slug';
import { parseAvailabilityStatus } from '@/lib/product-availability';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}
function trimStr(value: unknown, max = 2000): string {
  return String(value ?? '').trim().slice(0, max);
}
function optStr(value: unknown, max = 2000): string | null {
  const v = trimStr(value, max);
  return v ? v : null;
}
function safeSortOrder(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}
function isSafeMediaOwnerId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(value);
}
const MEDIA_DELETE_PREFIXES = ['products/', 'campaigns/', 'content/', 'catalogs/', 'drafts/', 'brands/', 'categories/'] as const;
function canDeleteMediaKey(key: string): boolean {
  return MEDIA_DELETE_PREFIXES.some((p) => key.startsWith(p));
}

function extOf(name: string, type: string) {
  const fromName = name.split('.').pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|avif|pdf)$/.test(fromName))
    return fromName === 'jpg' ? 'jpg' : fromName;
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

export interface SignInResult {
  ok: boolean;
  error?: string;
  /** Şifre doğru ancak 2FA kodu gerekli. */
  requiresTotp?: boolean;
}

const MAX_LOGIN_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES ?? 15);

export async function signIn(
  identifier: string,
  password: string,
  totp?: string,
): Promise<SignInResult> {
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = identifier.trim().toLowerCase();
  if (!id || !password) return { ok: false, error: 'Kullanıcı adı ve şifre gerekli.' };

  // Hesap kilitlemeye ek olarak kaba kuvvet denemelerini hesap ve IP bazında sınırla.
  if (isRateLimited(`login:${id}`, 10)) {
    return {
      ok: false,
      error: 'Çok fazla giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.',
    };
  }
  try {
    const ip = pickClientIp((await headers()) as unknown as Headers);
    if (isRateLimited(`login-ip:${ip}`, 30)) {
      return {
        ok: false,
        error: 'Çok fazla giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.',
      };
    }
  } catch {
    // Başlık okunamazsa IP limitini atla (hesap bazlı limit yine devrede).
  }

  const rows = await db
    .select()
    .from(adminUsers)
    .where(or(eq(adminUsers.username, id), eq(adminUsers.email, id)))
    .limit(1);
  const user = rows[0];
  if (!user || !user.isActive) return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.' };

  // Kilitliyse kalan süreyi bildir.
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const mins = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000));
    return {
      ok: false,
      error: `Hesap geçici olarak kilitli. ${mins} dakika sonra tekrar deneyin.`,
    };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = (user.failedAttempts ?? 0) + 1;
    const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS;
    await db
      .update(adminUsers)
      .set({
        failedAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60_000) : null,
      })
      .where(eq(adminUsers.id, user.id));
    await logActivity(
      user,
      'login_failed',
      'auth',
      user.id,
      `Başarısız giriş denemesi (${attempts})`,
    );
    return {
      ok: false,
      error: shouldLock
        ? `Çok fazla hatalı deneme. Hesap ${LOGIN_LOCK_MINUTES} dakika kilitlendi.`
        : 'Kullanıcı adı veya şifre hatalı.',
    };
  }

  // 2FA etkinse kod doğrulanmadan oturum açılmaz.
  if (user.totpEnabled && user.totpSecret) {
    if (!totp) return { ok: false, requiresTotp: true };
    let secret: string;
    try {
      secret = decryptTotpSecret(user.totpSecret);
    } catch {
      return { ok: false, requiresTotp: true, error: '2FA doğrulanamadı. Yöneticiye başvurun.' };
    }
    const codeOk = await verifyTotp(secret, totp);
    if (!codeOk) return { ok: false, requiresTotp: true, error: 'Doğrulama kodu hatalı.' };
  }

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date(), failedAttempts: 0, lockedUntil: null })
    .where(eq(adminUsers.id, user.id));
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

/**
 * Kullanıcının kendi şifresini değiştirmesi (her rol). Mevcut şifre
 * doğrulanmadan değişmez; başarılı değişimde kilit/deneme sayacı sıfırlanır.
 */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const current = typeof currentPassword === 'string' ? currentPassword : '';
  const next = typeof newPassword === 'string' ? newPassword : '';
  if (!current) return { ok: false, error: 'Mevcut şifre gerekli.' };
  if (!next || next.length < 12) {
    return { ok: false, error: 'Yeni şifre en az 12 karakter olmalı.' };
  }
  if (next.length > 128) {
    return { ok: false, error: 'Yeni şifre çok uzun.' };
  }
  if (next === current) {
    return { ok: false, error: 'Yeni şifre mevcut şifreyle aynı olamaz.' };
  }

  const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id)).limit(1);
  const user = rows[0];
  if (!user) return { ok: false, error: 'Kullanıcı bulunamadı.' };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { ok: false, error: 'Mevcut şifre hatalı.' };

  const passwordHash = await bcrypt.hash(next, 12);
  await db
    .update(adminUsers)
    .set({ passwordHash, failedAttempts: 0, lockedUntil: null })
    .where(eq(adminUsers.id, admin.id));
  await logActivity(admin, 'update', 'auth', admin.id, 'Şifre değiştirildi');
  return { ok: true };
}

/** 2FA kurulumu başlatır: secret + otpauth URI döndürür (henüz etkinleştirmez). */
export async function startTotpSetup(): Promise<{
  ok: boolean;
  secret?: string;
  uri?: string;
  error?: string;
}> {
  const admin = await requireAdminUser();
  const account = (admin.username ?? admin.email ?? 'admin').replace(/[^a-zA-Z0-9._@-]/g, '').slice(0, 64) || 'admin';
  const secret = createTotpSecret();
  const uri = totpKeyUri(account, secret);
  return { ok: true, secret, uri };
}

/** Girilen kodla 2FA'yı doğrulayıp etkinleştirir. */
export async function enableTotp(
  secret: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  const cleanSecret = typeof secret === 'string' ? secret.trim().replace(/\s+/g, '') : '';
  const cleanCode = typeof code === 'string' ? code.trim() : '';
  if (!/^[A-Z2-7]{16,128}$/i.test(cleanSecret)) {
    return { ok: false, error: 'Geçersiz 2FA anahtarı.' };
  }
  const ok = await verifyTotp(cleanSecret, cleanCode);
  if (!ok) return { ok: false, error: 'Kod doğrulanamadı.' };
  await db
    .update(adminUsers)
    .set({ totpSecret: encryptTotpSecret(cleanSecret), totpEnabled: true })
    .where(eq(adminUsers.id, admin.id));
  await logActivity(admin, 'update', 'auth', admin.id, '2FA etkinleştirildi');
  return { ok: true };
}

/** 2FA'yı kapatır (mevcut kod gerekir). */
export async function disableTotp(code: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!admin.totpSecret || !admin.totpEnabled) return { ok: false, error: '2FA zaten kapalı.' };
  const cleanCode = typeof code === 'string' ? code.trim() : '';
  let secret: string;
  try {
    secret = decryptTotpSecret(admin.totpSecret);
  } catch {
    return { ok: false, error: '2FA secret okunamadı. Yöneticiye başvurun.' };
  }
  const ok = await verifyTotp(secret, cleanCode);
  if (!ok) return { ok: false, error: 'Kod doğrulanamadı.' };
  await db
    .update(adminUsers)
    .set({ totpEnabled: false, totpSecret: null })
    .where(eq(adminUsers.id, admin.id));
  await logActivity(admin, 'update', 'auth', admin.id, '2FA kapatıldı');
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

  if (!MEDIA_FOLDERS.includes(folder)) return { error: 'Geçersiz klasör.' };
  const safeOwner =
    typeof ownerId === 'string' && isSafeMediaOwnerId(ownerId.trim()) ? ownerId.trim() : 'drafts';

  const isPdf = ALLOWED_PDF_MIME.includes(file.type);
  if (isPdf) {
    if (file.size > MAX_PDF_MB * 1024 * 1024)
      return { error: `PDF en fazla ${MAX_PDF_MB} MB olabilir.` };
  } else {
    const invalid = validateUpload(file);
    if (invalid) return { error: invalid };
  }

  const original = Buffer.from(await file.arrayBuffer());

  // Uzantısı değiştirilmiş dosyalar sharp'e girmeden reddedilir (imza kontrolü).
  if (!isPdf) {
    const bad = validateImageSignature(original.subarray(0, 16));
    if (bad) return { error: bad };
  } else if (original.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return { error: 'PDF içeriği geçersiz.' };
  }

  let body: Buffer = original;
  let contentType = file.type || 'image/jpeg';
  let ext = extOf(file.name, file.type);

  // Görselleri optimize et (boyut küçültme + WebP'ye çevirme). PDF'e dokunma.
  if (!isPdf) {
    const optimized = await optimizeImage(original, contentType);
    body = optimized.buffer as Buffer;
    contentType = optimized.contentType;
    ext = optimized.ext;
  }

  const key = `${folder}/${safeOwner}/${crypto.randomUUID()}.${ext}`;
  try {
    await putObject(key, body, contentType);
  } catch {
    return { error: 'Yükleme başarısız. Depolama bağlantısını kontrol edin.' };
  }
  await logActivity(admin, 'upload', 'media', key, `Yüklendi: ${key}`);
  return { url: publicUrl(key) };
}

export async function deleteMedia(url: string): Promise<void> {
  const admin = await requireOwner();
  const key = typeof url === 'string' ? toObjectKey(url) : null;
  if (key && canDeleteMediaKey(key)) {
    await deleteObject(key);
    await logActivity(admin, 'delete', 'media', key, `Silindi: ${key}`);
  }
}

/** Medya kütüphanesinden nesne anahtarıyla siler. */
export async function deleteMediaKey(key: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const raw = typeof key === 'string' ? key.trim() : '';
  const objectKey = toObjectKey(raw) ?? (raw && !raw.includes('://') && !raw.startsWith('/') ? raw : null);
  if (!objectKey) return { ok: false, error: 'Geçersiz anahtar.' };
  if (!canDeleteMediaKey(objectKey)) return { ok: false, error: 'Bu medya anahtarı silinemez.' };
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
  /** Virgülle ayrılmış renk / kalınlık seçenekleri. */
  colors?: string;
  thicknesses?: string;
  dimensions?: string;
  /** Virgülle ayrılmış uygulama alanları. */
  applications?: string;
  shortDescription?: string;
  description?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  technicalSpecs?: { label: string; value: string }[];
  documents?: { title: string; url: string }[];
  images: string[];
  isActive?: boolean;
  /** Çok dilli alanlar (opsiyonel); boşsa TR değeri kullanılır. */
  nameEn?: string;
  nameAr?: string;
  catEn?: string;
  catAr?: string;
  seoTitle?: string;
  seoDescription?: string;
  whatsappMessage?: string;
  whatsappMessageEn?: string;
  whatsappMessageAr?: string;
  /** Temin durumu (opsiyonel): in_stock | on_order | check_availability */
  availabilityStatus?: string;
}

export async function saveProduct(
  input: ProductInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined;
  if (id && !isUuid(id)) return { ok: false, error: 'Geçersiz ürün kimliği.' };

  const name = trimStr(input.name, 300);
  const code = trimStr(input.code, 120);
  const cat = trimStr(input.cat, 200);
  if (!name || !code || !cat) return { ok: false, error: 'Ad, kod ve kategori zorunludur.' };

  // `products.code` bir seri/malzeme kodu olduğu için **tekil değildir**:
  // örn. `PVC KENAR` kategorisindeki 105 ürünün kodu `PVC`, `MDF` kategorisindeki
  // 11 ürünün kodu `MDF`'dir. Bu nedenle kod benzersizliği zorlanmaz; aksi halde
  // mevcut ürünlerin büyük kısmı admin'den düzenlenemez hale gelir.
  //
  // Korunan tek kural: aynı kategori + kod + ad ile **ikinci bir kayıt
  // açılamaz** (41 saniye arayla oluşan kazara çift kayıtları engeller).
  // Düzenleme bu kontrolde kendi kaydı hariç tutulur.
  const dupes = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.code, code), eq(products.cat, cat), eq(products.name, name)))
    .limit(2);
  if (dupes.some((d) => d.id !== id)) {
    return {
      ok: false,
      error: `Bu kategoride aynı kod ve adla bir ürün zaten var: "${cat} / ${code} / ${name}". Ürün kodları seri kodu olduğu için farklı ürünler aynı kodu kullanabilir, ancak aynı üçlü tekrar edemez.`,
    };
  }

  const inputImages = Array.isArray(input.images) ? input.images : [];
  const keys = inputImages
    .map((u) => {
      const raw = String(u ?? '').trim();
      if (!raw) return null;
      const k = toObjectKey(raw);
      if (k) return k;
      if (/^(https?:\/\/|\/)/i.test(raw) && !raw.startsWith('data:')) return raw.slice(0, 2048);
      return null;
    })
    .filter((k): k is string => !!k)
    .slice(0, 20);
  const img = serializeImageField(keys);
  const isActive = input.isActive ?? true;
  const nameEn = optStr(input.nameEn, 300);
  const nameAr = optStr(input.nameAr, 300);
  const catEn = optStr(input.catEn, 200);
  const catAr = optStr(input.catAr, 200);
  const seoTitle = optStr(input.seoTitle, 200);
  const seoDescription = optStr(input.seoDescription, 500);
  const whatsappMessage = optStr(input.whatsappMessage, 2000);
  const whatsappMessageEn = optStr(input.whatsappMessageEn, 2000);
  const whatsappMessageAr = optStr(input.whatsappMessageAr, 2000);
  const availabilityStatus = parseAvailabilityStatus(input.availabilityStatus) ?? null;
  const face = optStr(input.face, 200);
  const colors = optStr(input.colors, 500);
  const thicknesses = optStr(input.thicknesses, 500);
  const dimensions = optStr(input.dimensions, 200);
  const applications = optStr(input.applications, 1000);
  const shortDescription = optStr(input.shortDescription, 1000);
  const description = optStr(input.description, 10000);
  const descriptionEn = optStr(input.descriptionEn, 10000);
  const descriptionAr = optStr(input.descriptionAr, 10000);
  const technicalSpecs = (Array.isArray(input.technicalSpecs) ? input.technicalSpecs : [])
    .slice(0, 40)
    .map((s) => ({ label: trimStr(s?.label, 120), value: trimStr(s?.value, 240) }))
    .filter((s) => s.label && s.value);
  const documents = (Array.isArray(input.documents) ? input.documents : [])
    .slice(0, 20)
    .map((d) => ({
      title: trimStr(d?.title, 200),
      url: safeHref(trimStr(d?.url, 2048)),
    }))
    .filter((d) => d.title && d.url);

  if (id) {
    const prev = await db
      .select({ img: products.img })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    const oldKeys = parseImageField(prev[0]?.img ?? '')
      .map((v) => toObjectKey(v))
      .filter((k): k is string => !!k);
    const next = new Set(keys.filter((k) => toObjectKey(k)));

    await db
      .update(products)
      .set({
        name,
        code,
        cat,
        face,
        colors,
        thicknesses,
        dimensions,
        applications,
        shortDescription,
        description,
        descriptionEn,
        descriptionAr,
        technicalSpecs: technicalSpecs.length > 0 ? technicalSpecs : null,
        documents: documents.length > 0 ? documents : null,
        img,
        isActive,
        nameEn,
        nameAr,
        catEn,
        catAr,
        seoTitle,
        seoDescription,
        whatsappMessage,
        whatsappMessageEn,
        whatsappMessageAr,
        availabilityStatus,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    for (const key of oldKeys) {
      if (!next.has(key)) await deleteObject(key);
    }
    await logActivity(admin, 'update', 'product', id, `Ürün güncellendi: ${name}`);
    await flushSiteCaches();
    return { ok: true, id };
  }

  const inserted = await db
    .insert(products)
    .values({
      name,
      code,
      cat,
      face,
      colors,
      thicknesses,
      dimensions,
      applications,
      shortDescription,
      description,
      descriptionEn,
      descriptionAr,
      technicalSpecs: technicalSpecs.length > 0 ? technicalSpecs : null,
      documents: documents.length > 0 ? documents : null,
      img,
      isActive,
      nameEn,
      nameAr,
      catEn,
      catAr,
      seoTitle,
      seoDescription,
      whatsappMessage,
      whatsappMessageEn,
      whatsappMessageAr,
      availabilityStatus,
    })
    .returning({ id: products.id });

  await logActivity(admin, 'create', 'product', inserted[0]?.id, `Ürün eklendi: ${name}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz ürün kimliği.' };

  const prev = await db
    .select({ img: products.img, name: products.name })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  const keys = parseImageField(prev[0]?.img ?? '')
    .map((v) => toObjectKey(v))
    .filter((k): k is string => !!k);

  await db.delete(products).where(eq(products.id, id));
  for (const key of keys) await deleteObject(key);

  await logActivity(admin, 'delete', 'product', id, `Ürün silindi: ${prev[0]?.name ?? id}`);
  await flushSiteCaches();
  return { ok: true };
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz ürün kimliği.' };
  await db
    .update(products)
    .set({ isActive: !!isActive, updatedAt: new Date() })
    .where(eq(products.id, id));
  await logActivity(
    admin,
    'update',
    'product',
    id,
    isActive ? 'Ürün aktifleştirildi' : 'Ürün pasifleştirildi',
  );
  await flushSiteCaches();
  return { ok: true };
}

export async function bulkDeleteProducts(ids: string[]): Promise<{ ok: boolean; deleted: number }> {
  const admin = await requireOwner();
  const db = getDb();
  const cleanIds = Array.isArray(ids)
    ? Array.from(new Set(ids.filter((id): id is string => isUuid(id)))).slice(0, 500)
    : [];
  if (!db || cleanIds.length === 0) return { ok: false, deleted: 0 };

  const rows = await db
    .select({ img: products.img })
    .from(products)
    .where(inArray(products.id, cleanIds));
  for (const row of rows) {
    const keys = parseImageField(row.img ?? '')
      .map((v) => toObjectKey(v))
      .filter((k): k is string => !!k);
    for (const key of keys) await deleteObject(key);
  }
  await db.delete(products).where(inArray(products.id, cleanIds));
  await logActivity(admin, 'delete', 'product', undefined, `${cleanIds.length} ürün toplu silindi`);
  await flushSiteCaches();
  return { ok: true, deleted: cleanIds.length };
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

  // Kötüye kullanımı önle: sınırsız CSV tek çağrıda DB'yi kilitleyemesin.
  const MAX_CSV_BYTES = 5 * 1024 * 1024;
  const MAX_CSV_ROWS = 5000;
  if (csv.length > MAX_CSV_BYTES) {
    return { ok: false, error: 'CSV çok büyük (en fazla 5 MB).', created: 0, updated: 0 };
  }

  const rows = parseCsv(csv);
  if (rows.length === 0) return { ok: false, error: 'Dosya boş.', created: 0, updated: 0 };
  if (rows.length - 1 > MAX_CSV_ROWS) {
    return {
      ok: false,
      error: `En fazla ${MAX_CSV_ROWS} satır içe aktarılabilir.`,
      created: 0,
      updated: 0,
    };
  }

  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iCode = idx('code');
  const iName = idx('name');
  const iCat = idx('cat');
  if (iCode === -1 || iName === -1 || iCat === -1) {
    return {
      ok: false,
      error: 'CSV başlığı code,name,cat en az içermeli.',
      created: 0,
      updated: 0,
    };
  }
  const iFace = idx('face');
  const iImg = idx('img');
  const iActive = idx('is_active');
  const iNameEn = idx('name_en');
  const iNameAr = idx('name_ar');
  const iCatEn = idx('cat_en');
  const iCatAr = idx('cat_ar');
  const iAvailability = idx('availability_status');

  let created = 0;
  let updated = 0;

  // Mevcut ürünleri tek sorguda çek (satır başına SELECT = N+1 önlenir).
  const existingRows = await db
    .select({ id: products.id, code: products.code, cat: products.cat, name: products.name })
    .from(products);
  const existingMap = new Map(
    existingRows.map((p) => [`${p.code}\u0000${p.cat}\u0000${p.name}`, p.id]),
  );

  await db.transaction(async (tx) => {
    for (const r of rows.slice(1)) {
      const code = (r[iCode] ?? '').trim();
      const name = (r[iName] ?? '').trim();
      const cat = (r[iCat] ?? '').trim();
      if (!code || !name || !cat) continue;

      const face = iFace >= 0 ? (r[iFace] ?? '').trim() || null : null;
      const imgRaw = iImg >= 0 ? (r[iImg] ?? '').trim() : '';
      const img = imgRaw
        ? (toObjectKey(imgRaw) ?? (/^(https?:\/\/|\/)/i.test(imgRaw) && !imgRaw.startsWith('data:') ? imgRaw.slice(0, 2048) : null))
        : null;
      const isActive =
        iActive >= 0 ? !/^(0|false|pasif|hayir)$/i.test((r[iActive] ?? '').trim()) : true;
      const nameEn = iNameEn >= 0 ? (r[iNameEn] ?? '').trim() || null : null;
      const nameAr = iNameAr >= 0 ? (r[iNameAr] ?? '').trim() || null : null;
      const catEn = iCatEn >= 0 ? (r[iCatEn] ?? '').trim() || null : null;
      const catAr = iCatAr >= 0 ? (r[iCatAr] ?? '').trim() || null : null;
      const availabilityStatus =
        iAvailability >= 0 ? parseAvailabilityStatus(r[iAvailability]) ?? null : undefined;

      // Eşleştirme `code` ile yapılırsa seri kodlu ürünler çakışır (105 ürünün
      // kodu `PVC`); bu satırın adını ve kategorisini de eşleştirmeye katıyoruz.
      const existingId = existingMap.get(`${code}\u0000${cat}\u0000${name}`);
      if (existingId) {
        updated++;
        if (!dryRun) {
          const updateSet: Record<string, unknown> = {
            name,
            cat,
            face,
            img,
            isActive,
            nameEn,
            nameAr,
            catEn,
            catAr,
            updatedAt: new Date(),
          };
          if (availabilityStatus !== undefined) updateSet.availabilityStatus = availabilityStatus;
          await tx.update(products).set(updateSet).where(eq(products.id, existingId));
        }
      } else {
        created++;
        if (!dryRun) {
          await tx.insert(products).values({
            code,
            name,
            cat,
            face,
            img,
            isActive,
            nameEn,
            nameAr,
            catEn,
            catAr,
            ...(availabilityStatus !== undefined ? { availabilityStatus } : {}),
          });
        }
      }
    }
  });

  if (!dryRun) {
    await logActivity(
      admin,
      'update',
      'product',
      undefined,
      `CSV içe aktarma: ${created} yeni, ${updated} güncelleme`,
    );
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

export async function saveCampaign(
  input: CampaignInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined;
  if (id && !isUuid(id)) return { ok: false, error: 'Geçersiz kampanya kimliği.' };

  const title = trimStr(input.title, 200);
  if (!title) return { ok: false, error: 'Başlık zorunludur.' };

  const imageInput = trimStr(input.imageUrl, 2048);
  const startsAt = input.startsAt ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  const payload = {
    title,
    description: optStr(input.description, 2000),
    imageUrl: imageInput
      ? (toObjectKey(imageInput) ?? (/^(https?:\/\/|\/)/i.test(imageInput) ? imageInput : null))
      : null,
    linkUrl: safeHref(input.linkUrl) || null,
    linkLabel: trimStr(input.linkLabel, 80) || 'İncele',
    sortOrder: safeSortOrder(input.sortOrder),
    isActive: !!input.isActive,
    startsAt: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : null,
    endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
    titleEn: optStr(input.titleEn, 200),
    titleAr: optStr(input.titleAr, 200),
    descriptionEn: optStr(input.descriptionEn, 2000),
    descriptionAr: optStr(input.descriptionAr, 2000),
    linkLabelEn: optStr(input.linkLabelEn, 80),
    linkLabelAr: optStr(input.linkLabelAr, 80),
  };

  if (id) {
    await db.update(campaigns).set(payload).where(eq(campaigns.id, id));
    await logActivity(admin, 'update', 'campaign', id, `Kampanya güncellendi: ${title}`);
    await flushSiteCaches();
    return { ok: true, id };
  }

  const inserted = await db.insert(campaigns).values(payload).returning({ id: campaigns.id });
  await logActivity(admin, 'create', 'campaign', inserted[0]?.id, `Kampanya eklendi: ${title}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz kampanya kimliği.' };

  const prev = await db
    .select({ imageUrl: campaigns.imageUrl, title: campaigns.title })
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
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

export async function saveCatalog(
  input: CatalogInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined;
  if (id && !isUuid(id)) return { ok: false, error: 'Geçersiz katalog kimliği.' };

  const title = trimStr(input.title, 200);
  if (!title) return { ok: false, error: 'Başlık zorunludur.' };
  const slug = trimStr(input.slug, 200) || slugifyCatalog(title) || crypto.randomUUID();

  const coverInput = trimStr(input.cover, 2048);
  const pdfInput = trimStr(input.pdfUrl, 2048);
  const payload = {
    slug,
    title,
    description: optStr(input.description, 4000),
    year: Number.isFinite(Number(input.year)) && Number(input.year) > 0 ? Math.trunc(Number(input.year)) : null,
    cover: coverInput
      ? (toObjectKey(coverInput) ?? (/^(https?:\/\/|\/)/i.test(coverInput) ? coverInput : null))
      : null,
    pdfUrl: pdfInput
      ? (toObjectKey(pdfInput) ?? (/^(https?:\/\/|\/)/i.test(pdfInput) ? pdfInput : null))
      : null,
    pageCount:
      Number.isFinite(Number(input.pageCount)) && Number(input.pageCount) > 0
        ? Math.trunc(Number(input.pageCount))
        : null,
    sortOrder: safeSortOrder(input.sortOrder),
    isActive: !!input.isActive,
    titleEn: optStr(input.titleEn, 200),
    titleAr: optStr(input.titleAr, 200),
    descriptionEn: optStr(input.descriptionEn, 4000),
    descriptionAr: optStr(input.descriptionAr, 4000),
  };

  if (id) {
    await db.update(catalogs).set(payload).where(eq(catalogs.id, id));
    await logActivity(admin, 'update', 'catalog', id, `Katalog güncellendi: ${title}`);
    await flushSiteCaches();
    return { ok: true, id };
  }

  const inserted = await db.insert(catalogs).values(payload).returning({ id: catalogs.id });
  await logActivity(admin, 'create', 'catalog', inserted[0]?.id, `Katalog eklendi: ${title}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteCatalog(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz katalog kimliği.' };

  const prev = await db
    .select({ cover: catalogs.cover, pdfUrl: catalogs.pdfUrl, title: catalogs.title })
    .from(catalogs)
    .where(eq(catalogs.id, id))
    .limit(1);
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

export async function saveCategory(
  input: CategoryInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined;
  if (id && !isUuid(id)) return { ok: false, error: 'Geçersiz kategori kimliği.' };

  const name = trimStr(input.name, 200);
  if (!name) return { ok: false, error: 'Ad zorunludur.' };
  const slug = trimStr(input.slug, 200) || slugify(name) || crypto.randomUUID();
  const thumb = trimStr(input.thumbnail, 2048);
  const hero = trimStr(input.heroImage, 2048);

  const payload = {
    slug,
    name,
    nameEn: optStr(input.nameEn, 200),
    nameAr: optStr(input.nameAr, 200),
    description: optStr(input.description, 4000),
    descriptionEn: optStr(input.descriptionEn, 4000),
    descriptionAr: optStr(input.descriptionAr, 4000),
    shortDescription: optStr(input.shortDescription, 1000),
    shortDescriptionEn: optStr(input.shortDescriptionEn, 1000),
    shortDescriptionAr: optStr(input.shortDescriptionAr, 1000),
    thumbnail: thumb
      ? (toObjectKey(thumb) ?? (/^(https?:\/\/|\/)/i.test(thumb) ? thumb : null))
      : null,
    heroImage: hero
      ? (toObjectKey(hero) ?? (/^(https?:\/\/|\/)/i.test(hero) ? hero : null))
      : null,
    featured: !!input.featured,
    sortOrder: safeSortOrder(input.sortOrder),
    isActive: !!input.isActive,
    seoTitle: optStr(input.seoTitle, 200),
    seoDescription: optStr(input.seoDescription, 500),
  };

  if (id) {
    await db.update(categories).set(payload).where(eq(categories.id, id));
    await logActivity(admin, 'update', 'category', id, `Kategori güncellendi: ${name}`);
    await flushSiteCaches();
    return { ok: true, id };
  }

  const inserted = await db.insert(categories).values(payload).returning({ id: categories.id });
  await logActivity(admin, 'create', 'category', inserted[0]?.id, `Kategori eklendi: ${name}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export type DeleteCategoryMode = 'block' | 'cascade' | 'deactivate';

export interface DeleteCategoryResult {
  ok: boolean;
  error?: string;
  /** Engellendiğinde/uyarıda bağlı ürün sayısı. */
  productCount?: number;
  /** Kullanıcıya gösterilecek örnek ürün adları. */
  samples?: string[];
}

interface CategoryProductRow {
  id: string;
  name: string | null;
  code: string | null;
  cat: string | null;
  img: string | null;
}

/**
 * Bir kategoriye bağlı ürünleri aynı normalizasyonla bulur.
 *
 * `products.cat` düz metin ve aynı kategoriyi farklı yazımlarla tutuyor
 * ("PVC KENAR", "MDF LAM"/"MDFLAM"). `fetchCategories()` ile aynı
 * `categorySlugOf()` kullanılır; aksi halde burada 0 bulunan kategori
 * vitrinden kaybolmaz.
 */
async function findProductsInCategory(slug: string): Promise<CategoryProductRow[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      cat: products.cat,
      img: products.img,
    })
    .from(products);
  return rows
    .filter((p) => categorySlugOf(p.cat ?? '') === slug)
    .map((p) => ({ id: String(p.id), name: p.name, code: p.code, cat: p.cat, img: p.img }));
}

/**
 * Kategori siler.
 *
 * - `block`: bağlı ürün varsa silmez, sayı ve örnekleri döndürür (varsayılan).
 * - `cascade`: önce bağlı ürünleri (ve görsellerini) siler, sonra kategoriyi.
 * - `deactivate`: ürünlere dokunmaz, kategoriyi pasifleştirir; vitrinden
 *   çıkar ama veri ve geçmiş teklifler korunur.
 *
 * Önceden kategori satırı silinip ürünler `cat` metniyle başıboş bırakılıyordu;
 * `fetchCategories()` listeyi ürünlerden türettiği için kategori "silinince"
 * geri doğuyordu.
 */
export async function deleteCategory(
  id: string,
  mode: DeleteCategoryMode = 'block',
): Promise<DeleteCategoryResult> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz kategori kimliği.' };
  if (mode !== 'block' && mode !== 'cascade' && mode !== 'deactivate') {
    return { ok: false, error: 'Geçersiz silme modu.' };
  }

  const prev = await db
    .select({
      thumbnail: categories.thumbnail,
      heroImage: categories.heroImage,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  const row = prev[0];
  if (!row) return { ok: false, error: 'Kategori bulunamadı.' };

  const name = row.name ?? '';
  const slug = row.slug || categorySlugOf(name);
  const linked = await findProductsInCategory(slug);
  const count = linked.length;
  const samples = linked.slice(0, 3).map((p) => `${p.name ?? '—'}${p.code ? ` (${p.code})` : ''}`);

  if (mode === 'block' && count > 0) {
    return {
      ok: false,
      error: `"${name}" kategorisinde ${count} ürün var. Kategoriyi silmek için ürünleri silin veya kategoriyi pasifleştirin.`,
      productCount: count,
      samples,
    };
  }

  if (mode === 'cascade' && count > 0) {
    const ids = linked.map((p) => p.id);
    await db.delete(products).where(inArray(products.id, ids));
    for (const p of linked) {
      const key = p.img ? toObjectKey(p.img) : null;
      if (key) await deleteObject(key);
    }
    await logActivity(
      admin,
      'delete',
      'category',
      id,
      `${count} ürün silindi, kategori silindi: ${name}`,
    );
  }

  if (mode === 'deactivate') {
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
    await logActivity(
      admin,
      'update',
      'category',
      id,
      `Kategori pasifleştirildi (${count} ürün korundu): ${name}`,
    );
    await flushSiteCaches();
    return { ok: true, productCount: count, samples };
  }

  await db.delete(categories).where(eq(categories.id, id));

  for (const url of [row.thumbnail, row.heroImage]) {
    const key = url ? toObjectKey(url) : null;
    if (key) await deleteObject(key);
  }
  if (mode !== 'cascade') {
    await logActivity(admin, 'delete', 'category', id, `Kategori silindi: ${name}`);
  }
  await flushSiteCaches();
  return { ok: true, productCount: count };
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

export async function saveBrand(
  input: BrandInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined;
  if (id && !isUuid(id)) return { ok: false, error: 'Geçersiz marka kimliği.' };

  const name = trimStr(input.name, 200);
  if (!name) return { ok: false, error: 'Ad zorunludur.' };
  const logo = trimStr(input.logo, 2048);

  const payload = {
    name,
    logo: logo ? (toObjectKey(logo) ?? (/^(https?:\/\/|\/)/i.test(logo) ? logo : null)) : null,
    url: safeHref(input.url) || null,
    category: optStr(input.category, 200),
    categoryEn: optStr(input.categoryEn, 200),
    categoryAr: optStr(input.categoryAr, 200),
    description: optStr(input.description, 2000),
    sortOrder: safeSortOrder(input.sortOrder),
    isActive: !!input.isActive,
  };

  if (id) {
    await db.update(brands).set(payload).where(eq(brands.id, id));
    await logActivity(admin, 'update', 'brand', id, `Marka güncellendi: ${name}`);
    await flushSiteCaches();
    return { ok: true, id };
  }

  const inserted = await db.insert(brands).values(payload).returning({ id: brands.id });
  await logActivity(admin, 'create', 'brand', inserted[0]?.id, `Marka eklendi: ${name}`);
  await flushSiteCaches();
  return { ok: true, id: inserted[0]?.id };
}

export async function deleteBrand(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz marka kimliği.' };

  const prev = await db
    .select({ logo: brands.logo, name: brands.name })
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1);
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

export async function saveContentBlock(
  input: ContentBlockInput,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const key = trimStr(input.key, 100);
  if (!key) return { ok: false, error: 'Blok anahtarı zorunludur.' };
  if (!/^[a-z0-9_.:-]{1,100}$/i.test(key)) return { ok: false, error: 'Geçersiz blok anahtarı.' };

  const values = {
    key,
    title: optStr(input.title, 500),
    subtitle: optStr(input.subtitle, 500),
    body: optStr(input.body, 20000),
    isActive: !!input.isActive,
    titleEn: optStr(input.titleEn, 500),
    titleAr: optStr(input.titleAr, 500),
    subtitleEn: optStr(input.subtitleEn, 500),
    subtitleAr: optStr(input.subtitleAr, 500),
    bodyEn: optStr(input.bodyEn, 20000),
    bodyAr: optStr(input.bodyAr, 20000),
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

export async function saveContentItem(
  input: ContentItemInput,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined;
  if (id && !isUuid(id)) return { ok: false, error: 'Geçersiz içerik kimliği.' };

  const blockKey = trimStr(input.blockKey, 100);
  if (!blockKey) return { ok: false, error: 'Blok anahtarı zorunludur.' };

  const imageInput = trimStr(input.imageUrl, 2048);
  const payload = {
    blockKey,
    title: optStr(input.title, 500),
    description: optStr(input.description, 10000),
    imageUrl: imageInput
      ? (toObjectKey(imageInput) ?? (/^(https?:\/\/|\/)/i.test(imageInput) ? imageInput : null))
      : null,
    linkUrl: safeHref(input.linkUrl) || null,
    tag: optStr(input.tag, 120),
    sortOrder: safeSortOrder(input.sortOrder),
    isActive: !!input.isActive,
    titleEn: optStr(input.titleEn, 500),
    titleAr: optStr(input.titleAr, 500),
    descriptionEn: optStr(input.descriptionEn, 10000),
    descriptionAr: optStr(input.descriptionAr, 10000),
    tagEn: optStr(input.tagEn, 120),
    tagAr: optStr(input.tagAr, 120),
  };

  if (id) {
    await db.update(contentItems).set(payload).where(eq(contentItems.id, id));
  } else {
    await db.insert(contentItems).values(payload);
  }

  await logActivity(
    admin,
    'update',
    'content',
    blockKey,
    `İçerik öğesi kaydedildi (${blockKey})`,
  );
  await flushSiteCaches();
  return { ok: true };
}

export async function deleteContentItem(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz içerik kimliği.' };

  const prev = await db
    .select({ imageUrl: contentItems.imageUrl })
    .from(contentItems)
    .where(eq(contentItems.id, id))
    .limit(1);
  await db.delete(contentItems).where(eq(contentItems.id, id));

  const url = prev[0]?.imageUrl;
  const key = url ? toObjectKey(url) : null;
  if (key) await deleteObject(key);
  await logActivity(admin, 'delete', 'content', id, 'İçerik öğesi silindi');
  await flushSiteCaches();
  return { ok: true };
}

/* ---------------- Hakkımızda içeriği (yapılandırılmış) ---------------- */

export interface AboutStatInput {
  value: string;
  label: string;
  labelEn?: string;
  labelAr?: string;
}
export interface AboutValueInput {
  title: string;
  text: string;
  titleEn?: string;
  titleAr?: string;
  textEn?: string;
  textAr?: string;
}
export interface AboutMilestoneInput {
  year: string;
  title: string;
  text: string;
  titleEn?: string;
  titleAr?: string;
  textEn?: string;
  textAr?: string;
}
export interface AboutInput {
  stats: AboutStatInput[];
  values: AboutValueInput[];
  timeline: AboutMilestoneInput[];
}

/** Hakkımızda içeriğini (istatistik/değer/zaman çizelgesi) topluca kaydeder. */
export async function saveAboutContent(
  input: AboutInput,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const KEY = 'about';

  // Mevcut about öğelerini değiştir.
  const rows: (typeof contentItems.$inferInsert)[] = [];
  let order = 0;

  for (const s of (Array.isArray(input.stats) ? input.stats : []).slice(0, 30)) {
    const value = trimStr(s?.value, 120);
    const label = trimStr(s?.label, 240);
    if (!value && !label) continue;
    rows.push({
      blockKey: KEY,
      tag: 'stat',
      title: value || null,
      description: label || null,
      titleEn: value || null,
      titleAr: value || null,
      descriptionEn: optStr(s?.labelEn, 240),
      descriptionAr: optStr(s?.labelAr, 240),
      sortOrder: order++,
      isActive: true,
    });
  }
  for (const v of (Array.isArray(input.values) ? input.values : []).slice(0, 30)) {
    const title = trimStr(v?.title, 200);
    const text = trimStr(v?.text, 2000);
    if (!title && !text) continue;
    rows.push({
      blockKey: KEY,
      tag: 'value',
      title: title || null,
      description: text || null,
      titleEn: optStr(v?.titleEn, 200),
      titleAr: optStr(v?.titleAr, 200),
      descriptionEn: optStr(v?.textEn, 2000),
      descriptionAr: optStr(v?.textAr, 2000),
      sortOrder: order++,
      isActive: true,
    });
  }
  for (const m of (Array.isArray(input.timeline) ? input.timeline : []).slice(0, 50)) {
    const year = trimStr(m?.year, 40);
    const title = trimStr(m?.title, 200);
    const text = trimStr(m?.text, 2000);
    if (!year && !title) continue;
    rows.push({
      blockKey: KEY,
      tag: 'timeline',
      title: year || null,
      description: title || null,
      linkUrl: text || null,
      titleEn: year || null,
      titleAr: year || null,
      descriptionEn: optStr(m?.titleEn, 200),
      descriptionAr: optStr(m?.titleAr, 200),
      tagEn: optStr(m?.textEn, 2000),
      tagAr: optStr(m?.textAr, 2000),
      sortOrder: order++,
      isActive: true,
    });
  }

  // Blok + öğe değişimini tek transaction'da yap (kısmi hata veri kaybı yaratmasın).
  await db.transaction(async (tx) => {
    await tx
      .insert(contentBlocks)
      .values({ key: KEY, title: 'Hakkımızda', isActive: true, updatedAt: new Date() })
      .onConflictDoNothing({ target: contentBlocks.key });
    await tx.delete(contentItems).where(eq(contentItems.blockKey, KEY));
    if (rows.length > 0) await tx.insert(contentItems).values(rows);
  });

  await logActivity(admin, 'update', 'content', KEY, 'Hakkımızda içeriği güncellendi');
  await flushSiteCaches();
  return { ok: true };
}

/* ---------------- Toplu çeviri ---------------- */

export type TranslationKind = 'product' | 'category' | 'campaign' | 'catalog' | 'content';

export interface TranslationUpdate {
  kind: TranslationKind;
  id: string;
  fields: Record<string, string>;
}

/** Toplu çeviri aracından tek bir kaydın çeviri alanlarını günceller. */
export async function saveTranslations(
  updates: TranslationUpdate[],
): Promise<{ ok: boolean; saved: number; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, saved: 0, error: 'Veritabanı bağlantısı yok.' };
  if (!Array.isArray(updates)) return { ok: false, saved: 0, error: 'Geçersiz veri.' };

  const tables = {
    product: products,
    category: categories,
    campaign: campaigns,
    catalog: catalogs,
    content: contentItems,
  } as const;
  const allowed: Record<TranslationKind, string[]> = {
    product: ['nameEn', 'nameAr', 'catEn', 'catAr'],
    category: ['nameEn', 'nameAr'],
    campaign: ['titleEn', 'titleAr'],
    catalog: ['titleEn', 'titleAr'],
    content: ['titleEn', 'titleAr'],
  };

  let saved = 0;
  for (const u of updates.slice(0, 500)) {
    if (!u || !(u.kind in tables) || !isUuid(u.id)) continue;
    const kind = u.kind as TranslationKind;
    const table = tables[kind];
    const fields = u.fields && typeof u.fields === 'object' ? u.fields : {};
    const set: Record<string, string | null> = {};
    for (const field of allowed[kind]) {
      if (field in fields) {
        set[field] = trimStr((fields as Record<string, unknown>)[field], 2000) || null;
      }
    }
    if (Object.keys(set).length === 0) continue;
    try {
      await db.update(table).set(set).where(eq(table.id, u.id));
      saved++;
    } catch {
      // tek kayıt hatası akışı bozmasın
    }
  }

  await logActivity(
    admin,
    'update',
    'translation',
    undefined,
    `Toplu çeviri: ${saved} kayıt güncellendi`,
  );
  await flushSiteCaches();
  return { ok: true, saved };
}

/* ---------------- Teklif talepleri ---------------- */

export async function deleteQuoteRequest(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz talep kimliği.' };

  await db.delete(quoteRequests).where(eq(quoteRequests.id, id));
  await logActivity(admin, 'delete', 'quote', id, 'Teklif talebi silindi');
  revalidatePath('/admin/teklifler');
  return { ok: true };
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz talep kimliği.' };
  if (!isQuoteStatus(status)) return { ok: false, error: 'Geçersiz durum.' };

  await db
    .update(quoteRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(quoteRequests.id, id));
  await logActivity(admin, 'update', 'quote', id, `Teklif durumu: ${status}`);
  revalidatePath('/admin/teklifler');
  return { ok: true };
}

export async function updateQuoteNote(
  id: string,
  internalNote: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };
  if (!isUuid(id)) return { ok: false, error: 'Geçersiz talep kimliği.' };

  await db
    .update(quoteRequests)
    .set({ internalNote: optStr(internalNote, 5000), updatedAt: new Date() })
    .where(eq(quoteRequests.id, id));
  await logActivity(admin, 'update', 'quote', id, 'Teklif dahili notu güncellendi');
  revalidatePath('/admin/teklifler');
  return { ok: true };
}

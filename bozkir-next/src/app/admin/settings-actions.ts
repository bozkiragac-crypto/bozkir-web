'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { inArray } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { products, siteSettings } from '@/lib/db/schema';
import { requireAdminUser, requireOwner, logActivity } from '@/lib/admin/guard';
import { SETTINGS_TAG, getSiteSettingsFresh, type SiteSettings } from '@/lib/data/settings';
import { sanitizeNav } from '@/lib/admin/nav';
import { cleanTextValue, type SiteTexts } from '@/i18n/overrides';
import { locales } from '@/i18n/config';
import { parseCoords, formatLatLng } from '@/lib/geo';
import { normalizeWeeklyHours } from '@/lib/open-hours';

/** Admin'den gelen metinleri yalnızca kayıtlı anahtarlarla ve sınırlı uzunlukta saklar. */
function sanitizeTexts(input?: SiteTexts): SiteTexts {
  const out: SiteTexts = { tr: {}, en: {}, ar: {} };
  for (const locale of locales) {
    for (const [path, raw] of Object.entries(input?.[locale] ?? {})) {
      const value = cleanTextValue(path, raw);
      if (value) out[locale]![path] = value;
    }
  }
  return out;
}

/** Logo/favicon için yalnızca same-origin yol veya http(s) URL kabul eder. */
function normalizeAssetUrl(value: string): string | null {
  const url = value.trim();
  if (!url) return '';
  if (/\s/.test(url)) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {
    // geçersiz
  }
  return null;
}

/** Ayar/metin değişiminde tüm public sayfaların yeniden üretilmesini sağlar. */
function revalidateAllSitePages() {
  revalidateTag(SETTINGS_TAG);
  revalidatePath('/');
  revalidatePath('/', 'layout');
  const pages = [
    '',
    '/urunler',
    '/kategoriler',
    '/katalog',
    '/hakkimizda',
    '/iletisim',
    '/teklif-al',
    '/sss',
    '/kvkk',
    '/gizlilik',
    '/cerez-politikasi',
    '/favoriler',
    '/karsilastir',
  ];
  for (const locale of locales) {
    revalidatePath(`/${locale}`, 'layout');
    for (const page of pages) revalidatePath(`/${locale}${page}`);
  }
}

export async function saveSiteSettings(
  input: SiteSettings,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  // Boş bırakılan SMTP parolası mevcut değeri korur (client'a hiç gönderilmez).
  const current = await getSiteSettingsFresh();
  const logoUrl = normalizeAssetUrl(input.identity?.logo ?? '');
  const faviconUrl = normalizeAssetUrl(input.identity?.favicon ?? '');
  if (logoUrl === null) {
    return { ok: false, error: 'Logo URL geçersiz. /yol veya http(s):// adresi kullanın.' };
  }
  if (faviconUrl === null) {
    return { ok: false, error: 'Favicon URL geçersiz. /yol veya http(s):// adresi kullanın.' };
  }

  const value: SiteSettings = {
    identity: {
      brandName: (input.identity?.brandName ?? '').trim() || current.identity.brandName,
      legalName: (input.identity?.legalName ?? '').trim() || current.identity.legalName,
      tagline: (input.identity?.tagline ?? '').trim() || current.identity.tagline,
      description: (input.identity?.description ?? '').trim() || current.identity.description,
      logo: logoUrl || current.identity.logo,
      favicon: faviconUrl || current.identity.favicon,
    },
    nav: sanitizeNav(input.nav, current.nav),
    footerNav: sanitizeNav(input.footerNav, current.footerNav),
    texts: input.texts ? sanitizeTexts(input.texts) : current.texts,
    phone: input.phone.trim(),
    phone2: input.phone2.trim(),
    whatsapp: input.whatsapp.trim(),
    email: input.email.trim(),
    hours: input.hours.trim(),
    hoursEn: input.hoursEn.trim(),
    hoursAr: input.hoursAr.trim(),
    address: {
      street: input.address.street.trim(),
      locality: input.address.locality.trim(),
      region: input.address.region.trim(),
      postalCode: input.address.postalCode.trim(),
      country: input.address.country.trim() || 'TR',
      coords: (input.address.coords ?? '').trim(),
    },
    warehouse: {
      address: input.warehouse.address.trim(),
      coords: input.warehouse.coords.trim(),
    },
    social: {
      instagram: input.social.instagram.trim(),
      facebook: input.social.facebook.trim(),
      youtube: (input.social.youtube ?? '').trim(),
      linkedin: (input.social.linkedin ?? '').trim(),
      x: (input.social.x ?? '').trim(),
    },
    popupEnabled: !!input.popupEnabled,
    popupCampaignId: (input.popupCampaignId ?? '').trim(),
    webhookUrl: (input.webhookUrl ?? '').trim(),
    featuredOrder: (input.featuredOrder ?? []).map((s) => s.trim()).filter(Boolean),
    featuredProducts: Array.isArray(input.featuredProducts)
      ? input.featuredProducts.map((s) => String(s).trim()).filter(Boolean).slice(0, 12)
      : current.featuredProducts,
    seoTitle: (input.seoTitle ?? '').trim(),
    seoDescription: (input.seoDescription ?? '').trim(),
    ogImage: (input.ogImage ?? '').trim(),
    heroImage: (input.heroImage ?? '').trim(),
    maintenance: !!input.maintenance,
    gaMeasurementId: (input.gaMeasurementId ?? '').trim(),
    metaPixelId: (input.metaPixelId ?? '').trim(),
    notifyEmail: (input.notifyEmail ?? '').trim(),
    smtp: {
      host: (input.smtp?.host ?? '').trim(),
      port: (input.smtp?.port ?? '587').trim() || '587',
      user: (input.smtp?.user ?? '').trim(),
      pass: (input.smtp?.pass ?? '') || current.smtp.pass,
      from: (input.smtp?.from ?? '').trim(),
    },
    whatsappMessages: {
      general: {
        tr: (input.whatsappMessages?.general?.tr ?? '').trim() || current.whatsappMessages.general.tr,
        en: (input.whatsappMessages?.general?.en ?? '').trim() || current.whatsappMessages.general.en,
        ar: (input.whatsappMessages?.general?.ar ?? '').trim() || current.whatsappMessages.general.ar,
      },
      product: {
        tr: (input.whatsappMessages?.product?.tr ?? '').trim() || current.whatsappMessages.product.tr,
        en: (input.whatsappMessages?.product?.en ?? '').trim() || current.whatsappMessages.product.en,
        ar: (input.whatsappMessages?.product?.ar ?? '').trim() || current.whatsappMessages.product.ar,
      },
    },
    kvkkText: (input.kvkkText ?? '').trim(),
    privacyText: (input.privacyText ?? '').trim(),
    cookiePolicyText: (input.cookiePolicyText ?? '').trim(),
    openHours: normalizeWeeklyHours(input.openHours),
  };

  // Koordinatlar ondalık ya da DMS girilebilir; kaydederken "lat,lng"e normalize et.
  const officeLL = parseCoords(value.address.coords);
  if (officeLL) value.address.coords = formatLatLng(officeLL);
  const depotLL = parseCoords(value.warehouse.coords);
  if (depotLL) value.warehouse.coords = formatLatLng(depotLL);

  await db
    .insert(siteSettings)
    .values({ key: 'site', value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });

  await logActivity(admin, 'update', 'settings', 'site', 'Site ayarları güncellendi');
  revalidateAllSitePages();
  return { ok: true };
}

/** Admin "Site Metinleri" editöründen gelen override'ları kaydeder. */
export async function saveSiteTexts(texts: SiteTexts): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const current = await getSiteSettingsFresh();
  const value: SiteSettings = { ...current, texts: sanitizeTexts(texts) };
  await db
    .insert(siteSettings)
    .values({ key: 'site', value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });

  await logActivity(admin, 'update', 'settings', 'site', 'Site metinleri güncellendi');
  revalidateAllSitePages();
  return { ok: true };
}

/**
 * Ana sayfadaki "Öne çıkan ürünler" seçimini/sırasını kaydeder.
 * Yalnızca gerçek ve aktif ürünler saklanır; sıra korunur.
 */
export async function saveFeaturedProducts(
  ids: string[],
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminUser();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const unique = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))].slice(0, 12);
  let next = unique;
  if (unique.length > 0) {
    const rows = await db
      .select({ id: products.id, isActive: products.isActive })
      .from(products)
      .where(inArray(products.id, unique));
    const valid = new Set(rows.filter((row) => row.isActive).map((row) => row.id));
    next = unique.filter((id) => valid.has(id));
  }

  const current = await getSiteSettingsFresh();
  const value: SiteSettings = { ...current, featuredProducts: next };
  await db
    .insert(siteSettings)
    .values({ key: 'site', value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });

  await logActivity(
    admin,
    'update',
    'settings',
    'site',
    `Öne çıkan ürünler güncellendi (${next.length})`,
  );
  revalidateAllSitePages();
  return { ok: true };
}

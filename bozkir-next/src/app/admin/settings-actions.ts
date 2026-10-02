'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { siteSettings } from '@/lib/db/schema';
import { requireOwner, logActivity } from '@/lib/admin/guard';
import { SETTINGS_TAG, type SiteSettings } from '@/lib/data/settings';
import { locales } from '@/i18n/config';

export async function saveSiteSettings(input: SiteSettings): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const value: SiteSettings = {
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
    seoTitle: (input.seoTitle ?? '').trim(),
    seoDescription: (input.seoDescription ?? '').trim(),
    ogImage: (input.ogImage ?? '').trim(),
    maintenance: !!input.maintenance,
    gaMeasurementId: (input.gaMeasurementId ?? '').trim(),
    metaPixelId: (input.metaPixelId ?? '').trim(),
    notifyEmail: (input.notifyEmail ?? '').trim(),
    smtp: {
      host: (input.smtp?.host ?? '').trim(),
      port: (input.smtp?.port ?? '587').trim() || '587',
      user: (input.smtp?.user ?? '').trim(),
      pass: input.smtp?.pass ?? '',
      from: (input.smtp?.from ?? '').trim(),
    },
    cookiePolicyText: (input.cookiePolicyText ?? '').trim(),
  };

  await db
    .insert(siteSettings)
    .values({ key: 'site', value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });

  await logActivity(admin, 'update', 'settings', 'site', 'Site ayarları güncellendi');
  revalidateTag(SETTINGS_TAG);
  // Statik üretilen public sayfaların metadata/footer'ı yeni ayarlarla
  // yeniden üretilsin diye dil köklerini hem sayfa hem layout olarak tazele.
  for (const l of locales) {
    revalidatePath(`/${l}`);
    revalidatePath(`/${l}`, 'layout');
  }
  revalidatePath('/');
  return { ok: true };
}

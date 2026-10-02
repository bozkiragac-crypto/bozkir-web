import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb, hasDb } from '@/lib/db/client';
import { siteSettings } from '@/lib/db/schema';
import { siteConfig } from '@/config/site';

export const SETTINGS_TAG = 'settings';
const SETTINGS_KEY = 'site';

export interface SiteSettings {
  phone: string;
  phone2: string;
  whatsapp: string;
  email: string;
  hours: string;
  hoursEn: string;
  hoursAr: string;
  address: {
    street: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
  };
  warehouse: {
    address: string;
    coords: string;
  };
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
    linkedin: string;
    x: string;
  };
  /** Girişte gösterilecek kampanya popup'ı aktif mi. */
  popupEnabled: boolean;
  /** Popup'ta gösterilecek kampanya id'si (boşsa ilk aktif kampanya). */
  popupCampaignId: string;
  /** Genel webhook URL'i; tanımlıysa olaylarda JSON POST atılır. */
  webhookUrl: string;
  /** Vitrinde gösterilecek kategori slug sırası (boşsa varsayılan). */
  featuredOrder: string[];
  /** Site geneli SEO başlığı (boşsa siteConfig). */
  seoTitle: string;
  seoDescription: string;
  /** OG görseli: tam URL veya /yol. */
  ogImage: string;
  /** Public site bakım modunda mı (env MAINTENANCE_MODE yedek). */
  maintenance: boolean;
  /** Google Analytics ölçüm kimliği (G-XXXX). */
  gaMeasurementId: string;
  /** Meta Pixel kimliği. */
  metaPixelId: string;
  /** Teklif bildirimlerinin gönderileceği e-posta. */
  notifyEmail: string;
  smtp: {
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
  };
  /** Çerez politikası metni (boşsa sözlük içeriği kullanılır). */
  cookiePolicyText: string;
}

function defaults(): SiteSettings {
  return {
    phone: siteConfig.phone,
    phone2: siteConfig.phone2,
    whatsapp: siteConfig.whatsapp,
    email: siteConfig.email,
    hours: siteConfig.hours,
    hoursEn: siteConfig.hoursEn,
    hoursAr: siteConfig.hoursAr,
    address: { ...siteConfig.address },
    warehouse: { ...siteConfig.warehouse },
    social: { ...siteConfig.social, youtube: '', linkedin: '', x: '' },
    popupEnabled: false,
    popupCampaignId: '',
    webhookUrl: '',
    featuredOrder: [],
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    maintenance: false,
    gaMeasurementId: '',
    metaPixelId: '',
    notifyEmail: '',
    smtp: { host: '', port: '587', user: '', pass: '', from: '' },
    cookiePolicyText: '',
  };
}

const loadSettings = unstable_cache(
  async (): Promise<Partial<SiteSettings>> => {
    const db = getDb()!;
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, SETTINGS_KEY)).limit(1);
    return (rows[0]?.value as Partial<SiteSettings>) ?? {};
  },
  ['site-settings'],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

function merge(base: SiteSettings, saved: Partial<SiteSettings>): SiteSettings {
  return {
    ...base,
    ...saved,
    address: { ...base.address, ...(saved.address ?? {}) },
    warehouse: { ...base.warehouse, ...(saved.warehouse ?? {}) },
    social: { ...base.social, ...(saved.social ?? {}) },
    smtp: { ...base.smtp, ...(saved.smtp ?? {}) },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const base = defaults();
  if (!hasDb()) return base;
  try {
    const saved = await loadSettings();
    return merge(base, saved);
  } catch {
    return base;
  }
}

/**
 * Önbelleksiz okuma: admin kaydettiği anda public siteye yansıması gereken
 * yerler (SEO metadata, footer) için. Tek satırlık indeksli sorgu olduğu
 * için istek başına maliyeti önemsizdir.
 */
export async function getSiteSettingsFresh(): Promise<SiteSettings> {
  const base = defaults();
  if (!hasDb()) return base;
  try {
    const db = getDb()!;
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, SETTINGS_KEY)).limit(1);
    return merge(base, (rows[0]?.value as Partial<SiteSettings>) ?? {});
  } catch {
    return base;
  }
}

export { telHref } from '@/lib/phone';

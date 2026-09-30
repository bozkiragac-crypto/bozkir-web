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
  };
  /** Vitrinde gösterilecek kategori slug sırası (boşsa varsayılan). */
  featuredOrder: string[];
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
    social: { ...siteConfig.social },
    featuredOrder: [],
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

export async function getSiteSettings(): Promise<SiteSettings> {
  const base = defaults();
  if (!hasDb()) return base;
  try {
    const saved = await loadSettings();
    return {
      ...base,
      ...saved,
      address: { ...base.address, ...(saved.address ?? {}) },
      warehouse: { ...base.warehouse, ...(saved.warehouse ?? {}) },
      social: { ...base.social, ...(saved.social ?? {}) },
    };
  } catch {
    return base;
  }
}

export { telHref } from '@/lib/phone';

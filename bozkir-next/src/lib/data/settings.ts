import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb, hasDb } from '@/lib/db/client';
import { siteSettings } from '@/lib/db/schema';
import { siteConfig } from '@/config/site';
import {
  DEFAULT_WHATSAPP_MESSAGES,
  type WhatsAppMessageSettings,
} from '@/lib/whatsapp';
import type { SiteTexts } from '@/i18n/overrides';

export const SETTINGS_TAG = 'settings';
const SETTINGS_KEY = 'site';

export interface NavSettingItem {
  key: string;
  href: string;
  visible: boolean;
}

export interface SiteSettings {
  /** Görünen marka kimliği (siteConfig fallback). */
  identity: {
    brandName: string;
    legalName: string;
    tagline: string;
    description: string;
    logo: string;
    favicon: string;
  };
  /** Ana menü sırası/görünürlüğü. */
  nav: NavSettingItem[];
  /** Footer kurumsal bağlantı sırası/görünürlüğü. */
  footerNav: NavSettingItem[];
  /** Admin'den düzenlenen sözlük metinleri (dil bazlı path → değer). */
  texts: SiteTexts;
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
    /** İş yeri (ofis) koordinatı: "lat,lng". */
    coords: string;
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
  /** Ana sayfada öne çıkarılacak ürün ID'leri (sıralı). */
  featuredProducts: string[];
  /** Site geneli SEO başlığı (boşsa siteConfig). */
  seoTitle: string;
  seoDescription: string;
  /** OG görseli: tam URL veya /yol. */
  ogImage: string;
  /** Ana sayfa (hero) arka plan görseli: tam URL veya /yol. Boşsa varsayılan kullanılır. */
  heroImage: string;
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
  /** WhatsApp genel ve ürün mesaj şablonları (TR/EN/AR). */
  whatsappMessages: WhatsAppMessageSettings;
  /** KVKK aydınlatma metni (boşsa sözlük içeriği kullanılır). */
  kvkkText: string;
  /** Gizlilik politikası metni (boşsa sözlük içeriği kullanılır). */
  privacyText: string;
  /** Çerez politikası metni (boşsa sözlük içeriği kullanılır). */
  cookiePolicyText: string;
  /** Yapılandırılmış açılış saatleri (0=Pazar … 6=Cumartesi). null = kapalı. */
  openHours: ({ open: string; close: string } | null)[];
}

const DEFAULT_NAV: NavSettingItem[] = siteConfig.nav.map((item) => ({
  key: item.key,
  href: item.href,
  visible: true,
}));

const DEFAULT_FOOTER_NAV: NavSettingItem[] = [
  { key: 'about', href: '/hakkimizda', visible: true },
  { key: 'dealers', href: '/bayilikler', visible: true },
  { key: 'catalogs', href: '/katalog', visible: true },
  { key: 'faq', href: '/sss', visible: true },
  { key: 'contact', href: '/iletisim', visible: true },
  { key: 'quote', href: '/teklif-al', visible: true },
];

function cloneNav(items: NavSettingItem[]): NavSettingItem[] {
  return items.map((item) => ({ ...item }));
}

function defaults(): SiteSettings {
  return {
    identity: {
      brandName: siteConfig.name,
      legalName: siteConfig.legalName,
      tagline: siteConfig.description,
      description: siteConfig.description,
      logo: '/images/bozkir-agac-logo.png',
      favicon: '/favicon.ico',
    },
    nav: cloneNav(DEFAULT_NAV),
    footerNav: cloneNav(DEFAULT_FOOTER_NAV),
    texts: { tr: {}, en: {}, ar: {} },
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
    featuredProducts: [],
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    heroImage: '',
    maintenance: false,
    gaMeasurementId: '',
    metaPixelId: '',
    notifyEmail: '',
    smtp: { host: '', port: '587', user: '', pass: '', from: '' },
    whatsappMessages: {
      general: { ...DEFAULT_WHATSAPP_MESSAGES.general },
      product: { ...DEFAULT_WHATSAPP_MESSAGES.product },
    },
    kvkkText: '',
    privacyText: '',
    cookiePolicyText: '',
    openHours: siteConfig.openHours.map((d) => (d ? { open: d.open, close: d.close } : null)),
  };
}

const loadSettings = unstable_cache(
  async (): Promise<Partial<SiteSettings>> => {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTINGS_KEY))
      .limit(1);
    return (rows[0]?.value as Partial<SiteSettings>) ?? {};
  },
  ['site-settings'],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

function merge(base: SiteSettings, saved: Partial<SiteSettings>): SiteSettings {
  return {
    ...base,
    ...saved,
    identity: { ...base.identity, ...(saved.identity ?? {}) },
    nav: saved.nav?.length ? cloneNav(saved.nav) : cloneNav(base.nav),
    footerNav: saved.footerNav?.length ? cloneNav(saved.footerNav) : cloneNav(base.footerNav),
    texts: {
      tr: { ...base.texts.tr, ...(saved.texts?.tr ?? {}) },
      en: { ...base.texts.en, ...(saved.texts?.en ?? {}) },
      ar: { ...base.texts.ar, ...(saved.texts?.ar ?? {}) },
    },
    address: { ...base.address, ...(saved.address ?? {}) },
    warehouse: { ...base.warehouse, ...(saved.warehouse ?? {}) },
    social: { ...base.social, ...(saved.social ?? {}) },
    smtp: { ...base.smtp, ...(saved.smtp ?? {}) },
    whatsappMessages: {
      general: { ...base.whatsappMessages.general, ...(saved.whatsappMessages?.general ?? {}) },
      product: { ...base.whatsappMessages.product, ...(saved.whatsappMessages?.product ?? {}) },
    },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const base = defaults();
  if (!hasDb()) return base;
  try {
    const saved = await loadSettings();
    return merge(base, saved);
  } catch (err) {
    console.error('[data:settings] getSiteSettings okuma hatası:', err);
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
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, SETTINGS_KEY))
      .limit(1);
    return merge(base, (rows[0]?.value as Partial<SiteSettings>) ?? {});
  } catch (err) {
    console.error('[data:settings] getSiteSettingsFresh okuma hatası:', err);
    return base;
  }
}

export { telHref } from '@/lib/phone';

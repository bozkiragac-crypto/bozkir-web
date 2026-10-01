import { getSiteSettings } from '@/lib/data/settings';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';
import { WhatsAppFabLink } from './WhatsAppFabLink';

/**
 * Sabit WhatsApp butonu: masaüstünde hover ile genişler, mobilde daire kalır.
 * Numara site ayarlarından (`whatsapp` / `phone`) gelir.
 */
export async function WhatsAppFab({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings();
  const dict = dictFor(locale);
  const w = dict.pages.whatsapp;
  const raw = settings.whatsapp || settings.phone;
  if (!raw) return null;

  const url = raw.startsWith('http')
    ? raw
    : `https://wa.me/${(settings.phone || raw).replace(/[^\d]/g, '')}`;
  const message = encodeURIComponent(w.message);
  const href = `${url}${url.includes('?') ? '&' : '?'}text=${message}`;

  return (
    <WhatsAppFabLink
      href={href}
      ariaLabel={w.aria}
      cursor={w.cursor}
      label={w.label}
      className="group fixed end-4 z-[120] inline-flex items-center gap-0 overflow-hidden rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.75)] transition-all duration-300 hover:gap-2 hover:pr-5 focus-visible:gap-2 focus-visible:pr-5 bottom-[max(1rem,calc(env(safe-area-inset-bottom,0px)+var(--compare-h,0px)))] md:end-6 md:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+var(--compare-h,0px)))]"
    />
  );
}

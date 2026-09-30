import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { resolveLocaleFromRequest } from '@/i18n/request';
import { localeDir, localeHtmlLang } from '@/i18n/config';

export const metadata: Metadata = {
  title: 'Kısa bir bakım — Bozkır Ağaç Ürünleri',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveLocaleFromRequest();
  return (
    <html lang={localeHtmlLang[locale]} dir={localeDir[locale]}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

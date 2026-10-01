import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { resolveLocaleFromRequest } from '@/i18n/request';
import { localeDir, localeHtmlLang } from '@/i18n/config';
import { fontVariables } from '@/lib/fonts';
import { themeScript } from '@/components/layout/DocumentAssets';

export const metadata: Metadata = {
  title: 'Kısa bir bakım — Bozkır Ağaç Ürünleri',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveLocaleFromRequest();
  return (
    <html lang={localeHtmlLang[locale]} dir={localeDir[locale]} className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Bakım bitince sayfa kendini yeniler. */}
        <meta httpEquiv="refresh" content="60" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

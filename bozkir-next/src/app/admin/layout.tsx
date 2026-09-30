import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces, Caveat } from 'next/font/google';
import '../globals.css';
import { getSession } from '@/lib/auth/session';
import { AdminShell } from '@/components/admin/AdminShell';
import { themeScript } from '@/components/layout/DocumentAssets';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { getDictionary } from '@/i18n/dictionaries';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin', 'latin-ext'], variable: '--font-fraunces', display: 'swap' });
const caveat = Caveat({ subsets: ['latin', 'latin-ext'], variable: '--font-hand', display: 'swap' });

export const metadata: Metadata = {
  title: 'Yönetim Paneli | Bozkır Ağaç Ürünleri',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/** Yönetim paneli kök layout'ı (site dili yalnızca Türkçedir). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="tr" dir="ltr" className={`${inter.variable} ${fraunces.variable} ${caveat.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <DictionaryProvider locale="tr" dictionary={getDictionary('tr')}>
          {/* Giriş sayfası: kabuk olmadan gösterilir. */}
          {session?.admin ? (
            <AdminShell username={session.username || session.email || session.name} role={session.role}>
              {children}
            </AdminShell>
          ) : (
            <div className="min-h-svh bg-background">{children}</div>
          )}
        </DictionaryProvider>
      </body>
    </html>
  );
}

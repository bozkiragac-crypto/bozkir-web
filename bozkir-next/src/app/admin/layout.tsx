import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import '../globals.css';
import { getSession } from '@/lib/auth/session';
import { getCurrentAdmin } from '@/lib/admin/guard';
import { fontVariables } from '@/lib/fonts';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminTabGuard } from '@/components/admin/AdminTabGuard';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { themeScript } from '@/components/layout/DocumentAssets';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { getDictionary } from '@/i18n/dictionaries';

export const metadata: Metadata = {
  title: 'Yönetim Paneli | Bozkır Ağaç Ürünleri',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/** Yönetim paneli kök layout'ı (site dili yalnızca Türkçedir). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // İmzalı token geçerli olsa bile kullanıcı pasifleştirilmiş/silinmiş olabilir;
  // bu durumda erişimi kes (giriş sayfası hariç) — oturum iptali boşluğunu kapatır.
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (session?.admin && pathname !== '/admin/login' && !(await getCurrentAdmin())) {
    redirect('/admin/login');
  }

  return (
    <html lang="tr" dir="ltr" className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <DictionaryProvider locale="tr" dictionary={getDictionary('tr')}>
          <ToastProvider>
            {/* Giriş sayfası: kabuk olmadan gösterilir. */}
            {session?.admin ? (
              <AdminShell
                username={session.username || session.email || session.name}
                role={session.role}
              >
                <AdminTabGuard />
                {children}
              </AdminShell>
            ) : (
              <div className="min-h-svh bg-background">{children}</div>
            )}
          </ToastProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { fontVariables } from '@/lib/fonts';
import { dictFor } from '@/i18n/server';

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export const metadata: Metadata = {
  title: 'Sayfa bulunamadı',
  robots: { index: false, follow: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/**
 * Dil öneği tutmayan (örn. eski) adresler için uygulama düzeyi 404.
 * Statik kalabilmesi için `headers()` kullanılmaz; varsayılan dil (TR) sözlüğü kullanılır.
 */
export default function NotFound() {
  const locale = 'tr';
  const nf = dictFor(locale).pages.notFound;

  return (
    <html lang={locale} className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <main className="container-x flex min-h-svh flex-col justify-center pt-24">
          <p className="text-eyebrow">{nf.eyebrow}</p>
          <h1 className="text-display mt-8 max-w-3xl">
            {nf.titleLead} <em className="text-editorial">{nf.titleEm}</em>
          </h1>
          <p className="mt-8 max-w-md text-muted-strong">{nf.body}</p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              href={`/${locale}`}
              className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-medium text-background"
            >
              {nf.home}
            </Link>
            <Link
              href={`/${locale}/urunler`}
              className="inline-flex h-12 items-center rounded-full border border-border px-7 text-sm font-medium"
            >
              {nf.products}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

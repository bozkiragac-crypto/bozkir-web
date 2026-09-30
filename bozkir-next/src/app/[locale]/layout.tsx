import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Fraunces, Caveat } from 'next/font/google';
import Script from 'next/script';
import '../globals.css';
import { isLocale, localeDir, localeHtmlLang, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { getPrimaryCategories } from '@/lib/api/categories';
import { getSiteSettings } from '@/lib/data/settings';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFab } from '@/components/layout/WhatsAppFab';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { ScrollToTop } from '@/components/providers/ScrollToTop';
import { CursorProvider } from '@/components/providers/CursorProvider';
import { FavoritesProvider } from '@/components/providers/FavoritesProvider';
import { CompareBar } from '@/components/products/CompareBar';
import { CampaignPopupServer } from '@/components/campaigns/CampaignPopupServer';
import { DictionaryProvider } from '@/i18n/DictionaryProvider';
import { siteConfig } from '@/config/site';
import { buildMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin', 'latin-ext'], variable: '--font-fraunces', display: 'swap' });
const caveat = Caveat({ subsets: ['latin', 'latin-ext'], variable: '--font-hand', display: 'swap' });

// Varsayılan açık tema; yalnızca kullanıcı koyu seçtiyse koyu uygulanır.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){}})();`;

// Dinamik davranışı sayfalara bırakıyoruz; statik/ISR mümkün olduğunca korunur.
// (Metadata ve organizer JSON-LD statik üretilebilir.)

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({ title: `${siteConfig.name} | Malzemenin Yeni Formu`, path: '/' }),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f7f5',
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/** Public site kök layout'ı: `<html lang dir>` burada dil ile birlikte belirlenir. */
export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const typed = locale as Locale;
  const dict = getDictionary(typed);
  const [categories, settings] = await Promise.all([getPrimaryCategories(typed), getSiteSettings()]);

  return (
    <html
      lang={localeHtmlLang[typed]}
      dir={localeDir[typed]}
      data-locale={typed}
      className={`${inter.variable} ${fraunces.variable} ${caveat.variable}`}
    >
      <head>
        {/* Tema, ilk boyamadan önce uygulanır (FOUC yok). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* JS varsa reveal başlangıç durumu uygulanır. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(typed)) }}
        />
      </head>
      <body className="antialiased">
        <DictionaryProvider locale={typed} dictionary={dict}>
          <FavoritesProvider>
            <SmoothScrollProvider>
              <ScrollToTop />
              <CursorProvider />
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-foreground focus:px-5 focus:py-3 focus:text-background"
              >
                {dict.nav.skipToContent}
              </a>
              <Header categories={categories} />
              <main id="main">{children}</main>
              <Footer s={settings} categories={categories} />
              <WhatsAppFab locale={typed} />
              <CompareBar />
              <CampaignPopupServer locale={typed} />
            </SmoothScrollProvider>
          </FavoritesProvider>
        </DictionaryProvider>
      </body>

      {process.env.NEXT_PUBLIC_ANALYTICS_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_ANALYTICS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_ANALYTICS_ID}');`}
          </Script>
        </>
      )}
    </html>
  );
}

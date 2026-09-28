import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { siteConfig } from '@/config/site';
import { buildMetadata, organizationJsonLd } from '@/lib/seo';
import { getPrimaryCategories } from '@/lib/api/categories';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...buildMetadata({
    title: `${siteConfig.name} | Malzemenin Yeni Formu`,
    path: '/',
  }),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPrimaryCategories();

  return (
    <html lang="tr" className={inter.variable}>
      <head>
        {/* JS varsa reveal başlangıç durumu uygulanır (FOUC yok). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </head>
      <body className="antialiased">
        <SmoothScrollProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-foreground focus:px-5 focus:py-3 focus:text-background"
          >
            İçeriğe geç
          </a>
          <Header categories={categories} />
          <main id="main">{children}</main>
          <Footer />
        </SmoothScrollProvider>

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
      </body>
    </html>
  );
}

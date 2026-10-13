import { Inter, Fraunces, Caveat, IBM_Plex_Sans_Arabic } from 'next/font/google';

/** Paylaşılan font tanımları (layout, admin, 404 aynı dosyaları kullanır). */
export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});
export const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fraunces',
  display: 'swap',
});
// Caveat yalnızca hero'daki el yazısı vurguda kullanılır; ilk boyama preload'una gerek yok.
export const caveat = Caveat({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-hand',
  display: 'swap',
  preload: false,
});
// Arapça (RTL) arayüz fontu: yalnızca `[dir='rtl']` sayfalarda yüklenir.
export const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
});

export const fontVariables = `${inter.variable} ${fraunces.variable} ${caveat.variable} ${arabic.variable}`;

import { Inter, Fraunces, IBM_Plex_Sans_Arabic } from 'next/font/google';

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
  axes: ['opsz'],
});
// Arapça (RTL) arayüz fontu: yalnızca `[dir='rtl']` sayfalarda yüklenir.
export const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
});

export const fontVariables = `${inter.variable} ${fraunces.variable} ${arabic.variable}`;

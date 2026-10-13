import { Inter, Fraunces, Caveat } from 'next/font/google';

/** Paylaşılan font tanımları (layout, admin, 404 aynı dosyaları kullanır). */
export const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });
export const fraunces = Fraunces({ subsets: ['latin', 'latin-ext'], variable: '--font-fraunces', display: 'swap' });
// Caveat yalnızca hero'daki el yazısı vurguda kullanılır; ilk boyama preload'una gerek yok.
export const caveat = Caveat({ subsets: ['latin', 'latin-ext'], variable: '--font-hand', display: 'swap', preload: false });

export const fontVariables = `${inter.variable} ${fraunces.variable} ${caveat.variable}`;

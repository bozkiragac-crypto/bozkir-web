import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind sınıflarını çakışma olmadan birleştirir. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Meta açıklamasını tek satıra indirir ve arama sonuçlarında kesilmeyecek
 * uzunlukta (~155 karakter) tutar. Boş metin verilirse `undefined` döner;
 * böylece çağıran taraf kendi fallback'ini kullanabilir.
 */
export function metaDescription(value: string | undefined | null, max = 155): string | undefined {
  const clean = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return undefined;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Değer geçerli bir CSS rengi ise (hex/rgb/hsl…) döndürür; değilse `undefined`. */
export function cssColor(value: string): string | undefined {
  const v = value.trim();
  if (/^#([0-9a-f]{3,8})$/i.test(v)) return v;
  if (/^(rgb|hsl|oklch|lab|lch|color)\(/i.test(v)) return v;
  return undefined;
}

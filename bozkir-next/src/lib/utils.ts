import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind sınıflarını çakışma olmadan birleştirir. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(raw: string) {
  return raw.replace(/\s+/g, ' ').trim();
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Değer geçerli bir CSS rengi ise (hex/rgb/hsl…) döndürür; değilse `undefined`. */
export function cssColor(value: string): string | undefined {
  const v = value.trim();
  if (/^#([0-9a-f]{3,8})$/i.test(v)) return v;
  if (/^(rgb|hsl|oklch|lab|lch|color)\(/i.test(v)) return v;
  return undefined;
}

/**
 * Hareket sabitleri — GSAP/Zaman çizelgeleri için JS karşılığı.
 * CSS token'larıyla (globals.css `@theme`) aynı ölçeği yansıtır.
 */

/** Saniye cinsinden süreler (GSAP). */
export const DUR = {
  fast: 0.2,
  base: 0.35,
  slow: 0.7,
  reveal: 0.9,
  count: 1.4,
} as const;

/** Liste staggered giriş adımları (saniye). */
export const STAGGER = {
  compact: 0.045,
  list: 0.05,
} as const;

/** "Malzemeyi Keşfet" sticky adımı: kategori başına kaydırma yüksekliği (vh). */
export const STORY_STEP_VH = 90;

import blurMap from '@/data/blur.json';

const map = blurMap as Record<string, string>;

/** Yerel görseller için üretilmiş blur verisini döndürür (yoksa undefined). */
export function blurDataURL(src?: string | null): string | undefined {
  if (!src || typeof src !== 'string') return undefined;
  return map[src];
}

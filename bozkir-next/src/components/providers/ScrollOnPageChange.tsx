'use client';

import { useEffect } from 'react';
import { scrollPageToTop } from '@/lib/lenis';

/**
 * Sayfalama (`?sayfa=`) değişiminde listeyi en üste taşır. Aynı pathname
 * içindeki filtre/sıralama değişimlerinde tetiklenmez.
 */
export function ScrollOnPageChange({ page }: { page: number }) {
  useEffect(() => {
    scrollPageToTop(true);
  }, [page]);

  return null;
}

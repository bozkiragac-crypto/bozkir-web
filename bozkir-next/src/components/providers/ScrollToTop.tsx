'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { scrollPageToTop } from '@/lib/lenis';

/**
 * Rota (pathname) değişince sayfayı en üste kaydırır.
 * Aynı sayfadaki filtre/arama (searchParams) değişimlerinde tetiklenmez;
 * böylece liste konumu korunur.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    scrollPageToTop();
  }, [pathname]);

  return null;
}

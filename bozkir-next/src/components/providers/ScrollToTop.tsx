'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { scrollPageToTop } from '@/lib/lenis';

/**
 * Rota (pathname) değişince sayfayı en üste kaydırır.
 * Aynı sayfadaki filtre/arama (searchParams) değişimlerinde tetiklenmez;
 * böylece liste konumu korunur. Tarayıcının geri/ileri konum geri yüklemesi
 * kapatılır; aksi halde ürün detayından dönüşte sayfa altta açılıyordu.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // bfcache'den dönen sayfada React effect'leri yeniden çalışmayabilir.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) scrollPageToTop(true);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    // Next.js'in kendi scroll işlemesinden sonra çalışmak için birkaç kez dene.
    scrollPageToTop(true);
    const raf = requestAnimationFrame(() => scrollPageToTop(true));
    const timer = window.setTimeout(() => scrollPageToTop(true), 60);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}

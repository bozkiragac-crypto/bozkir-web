'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * Lenis smooth scroll + ScrollTrigger senkronu.
 * - prefers-reduced-motion: Lenis tamamen devre dışı (native scroll).
 * - Native scroll davranışını bozmaz; yalnızca yumuşatır.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      touchMultiplier: 1.4,
      autoRaf: false,
    });

    // ScrollTrigger'ı Lenis'in scroll pozisyonuyla besle.
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    document.documentElement.classList.add('lenis', 'lenis-smooth');

    // Yükseklik değişince ölçümleri tazele. Çok sayıda refresh layout thrash
    // yarattığı için rAF ile bir çerçeveye indirilir.
    let refreshScheduled = false;
    const scheduleRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      requestAnimationFrame(() => {
        refreshScheduled = false;
        ScrollTrigger.refresh();
      });
    };
    scheduleRefresh();

    // Fontlar hazır olunca bir kez daha ölç (font swap yükseklik değiştirir).
    if (document.fonts?.ready) void document.fonts.ready.then(scheduleRefresh);

    // Görsel yüklenmeleri/gizli sekmeler gibi yükseklik değişimlerini izle.
    const ro = new ResizeObserver(scheduleRefresh);
    ro.observe(document.body);

    // Sekme gizliyken gereksiz rAF/Lenis çalışmasını durdur.
    const onVisibility = () => {
      if (document.hidden) lenis.stop();
      else {
        lenis.start();
        scheduleRefresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Sayfa içi çapa linkleri Lenis ile kaydırılsın.
    const onAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a[href^="#"]');
      if (!target) return;
      const id = target.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -80 });
    };
    document.addEventListener('click', onAnchorClick);

    return () => {
      document.removeEventListener('click', onAnchorClick);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      gsap.ticker.remove(raf);
      lenis.destroy();
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
    };
  }, []);

  return <>{children}</>;
}

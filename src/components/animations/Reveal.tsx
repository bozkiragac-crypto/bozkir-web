'use client';

import { createElement, useRef, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Gecikme (saniye) */
  delay?: number;
  y?: number;
  once?: boolean;
}

/**
 * Scroll ile yumuşak reveal. `prefers-reduced-motion` durumunda animasyon yok.
 */
export function Reveal({ children, className, as = 'div', delay = 0, y = 40, once = true }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: 'power3.out',
          // Animasyon bitince transform'u bırak: kalıcı `transform`, altındaki
          // fixed/pin elemanların referans kutusunu bozar.
          onComplete: () => gsap.set(el, { clearProps: 'transform' }),
          scrollTrigger: { trigger: el, start: 'top 88%', once },
        },
      );
    },
    { scope: ref, dependencies: [delay, y, once] },
  );

  return createElement(
    as,
    { ref: ref as never, className: cn(className), 'data-reveal': true },
    children,
  );
}

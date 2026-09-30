'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

/** Sayfa geçişlerinde hafif fade — kullanıcıyı bekletmez. */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Yalnızca opacity: transform kullanmak, altındaki `position: fixed`
      // pin'lerin referans kutusunu bozar (ScrollTrigger + Lenis).
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}

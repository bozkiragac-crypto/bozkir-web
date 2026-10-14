'use client';

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
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
 * Scroll ile yumuşak reveal — GSAP'sız (IntersectionObserver + CSS).
 * Görünürlük `html.js` ile kapılanır: JS yoksa içerik görünür kalır;
 * `prefers-reduced-motion` durumunda animasyon yok.
 */
export function Reveal({
  children,
  className,
  as = 'div',
  delay = 0,
  y = 40,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return createElement(
    as,
    {
      ref: ref as never,
      className: cn(className),
      'data-reveal': true,
      'data-in': inView ? 'true' : 'false',
      style: { '--reveal-y': `${y}px`, '--reveal-delay': `${delay * 1000}ms` } as CSSProperties,
    },
    children,
  );
}

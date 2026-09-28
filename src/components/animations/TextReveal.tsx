'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

interface TextRevealProps {
  /** Satır/sözcük bazlı hızlı reveal için düz metin bekler. */
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  /** 'words' hızlı, 'chars' daha etkileyici (yalnızca hero başlıkları için) */
  mode?: 'words' | 'chars';
  delay?: number;
  /** Viewport'a girince mi, hemen mi oynasın */
  triggerOnScroll?: boolean;
}

/**
 * Büyük başlıklar için sözcük/harf reveal. Yalnızca önemli başlıklarda kullanılmalı
 * (brief: her başlığı karakter karakter animasyon etme).
 */
export function TextReveal({
  text,
  as = 'h2',
  className,
  mode = 'words',
  delay = 0,
  triggerOnScroll = true,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as;

  const tokens = mode === 'chars' ? Array.from(text) : text.split(' ');

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const units = el.querySelectorAll('[data-unit]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(units, { yPercent: 0, opacity: 1 });
      return;
    }

    const anim = { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: mode === 'chars' ? 0.02 : 0.06, delay };

    if (triggerOnScroll) {
      gsap.fromTo(units, { yPercent: 110, opacity: 0 }, { ...anim, scrollTrigger: { trigger: el, start: 'top 85%' } });
    } else {
      gsap.fromTo(units, { yPercent: 110, opacity: 0 }, anim);
    }
  }, { scope: ref, dependencies: [text] });

  return (
    <Tag ref={ref as never} className={cn('[overflow:clip]', className)} aria-label={text}>
      {tokens.map((token, i) => (
        <span key={`${token}-${i}`} className="inline-block overflow-hidden align-bottom" aria-hidden>
          <span data-unit className="inline-block will-change-transform">
            {mode === 'chars' ? (token === ' ' ? '\u00A0' : token) : token}
            {mode === 'words' && i < tokens.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}

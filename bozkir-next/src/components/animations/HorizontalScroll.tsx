'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface HorizontalScrollProps {
  children: ReactNode;
  /** Bölüm başlığı — pin'lenen alanın İÇİNDE kalır (sabit görünür). */
  header?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * Desktop: dikey scroll → yatay ilerleme. Pin'lenen blok başlığı da kapsar,
 * böylece bölüm "havada asılı" görünmez; altta ilerleme çubuğu olur.
 * Mobile: native yatay swipe (scroll-snap).
 *
 * Not: Pin'lenen eleman overflow-hidden OLMAMALI; kırpma içeride yapılır.
 */
export function HorizontalScroll({ children, header, className, ...rest }: HorizontalScrollProps) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const { dict } = useDictionary();

  useGSAP(
    () => {
      const sectionEl = section.current;
      const trackEl = track.current;
      if (!sectionEl || !trackEl) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const getDistance = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);
        const tween = gsap.to(trackEl, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top top',
            end: () => `+=${getDistance()}`,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });
        return () => tween.kill();
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} className={cn('relative', className)} aria-label={rest['aria-label']}>
      <div className="overflow-hidden">
        {header && <div className="container-x pt-16 md:pt-20">{header}</div>}

        {/* Mobilde snap-proximity: son kartın hizalanamayıp yarım kalmasını önler. */}
        <div className="mt-8 overflow-x-auto pb-2 lg:overflow-visible">
          <div
            ref={track}
            data-cursor-label={dict.common.scroll}
            className="flex w-max snap-x snap-proximity gap-6 px-5 lg:px-[max(20px,4.2vw)] lg:will-change-transform"
          >
            {children}
          </div>
        </div>

        <div className="container-x mt-6 hidden lg:block">
          <div className="h-px w-full overflow-hidden bg-border">
            <div ref={bar} className="h-px w-full origin-left bg-foreground" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

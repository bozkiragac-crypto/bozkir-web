'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
  /** Aynı hizada sağda gösterilecek ek öğe (link vb.) */
  action?: React.ReactNode;
}

/**
 * Bölüm başlığı: satır/sözcük bazlı maske reveal (editoryal).
 * prefers-reduced-motion'da animasyonsuz görünür.
 */
export function SectionHeading({ eyebrow, title, body, className, action }: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const words = title.split(' ');

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const units = el.querySelectorAll('[data-unit]');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(units, { yPercent: 0, opacity: 1 });
        return;
      }
      gsap.fromTo(
        units,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power4.out',
          stagger: 0.045,
          scrollTrigger: { trigger: el, start: 'top 85%' },
        },
      );
    },
    { scope: ref, dependencies: [title] },
  );

  return (
    <div
      ref={ref}
      className={cn('flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8', className)}
    >
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="text-eyebrow flex items-center gap-2">
            <span className="h-px w-6 bg-accent" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 className="text-headline mt-4" aria-label={title}>
          {words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="relative -mb-[0.16em] -mt-[0.1em] inline-block overflow-hidden pb-[0.16em] pt-[0.1em] align-bottom"
              aria-hidden
            >
              <span data-unit className="inline-block">
                {word}
                {i < words.length - 1 ? '\u00A0' : ''}
              </span>
            </span>
          ))}
        </h2>
        {body && <p className="mt-5 max-w-2xl leading-relaxed text-muted-strong">{body}</p>}
      </div>
      {action}
    </div>
  );
}

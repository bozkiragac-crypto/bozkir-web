'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
 * Bölüm başlığı: kelime bazlı maske reveal — GSAP'sız (IO + CSS).
 * Görünürlük `html.js` ile kapılanır; JS yoksa başlık görünür kalır.
 */
export function SectionHeading({ eyebrow, title, body, className, action }: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const words = title.split(' ');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-heading-in={inView ? 'true' : 'false'}
      className={cn(
        'flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8',
        className,
      )}
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
              <span
                data-unit
                className="inline-block"
                style={{ '--reveal-delay': `${i * 45}ms` } as CSSProperties}
              >
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

'use client';

import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Campaign } from '@/types/campaign';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDictionary } from '@/i18n/DictionaryProvider';

const AUTOPLAY_MS = 6000;

export function CampaignSlider({ campaigns }: { campaigns: Campaign[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();
  const { t } = useDictionary();
  const touchX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const count = campaigns.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  // Ekran dışındayken autoplay durur (boşa render/CPU harcamaz).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting), {
      rootMargin: '150px',
    });
    io.observe(el);
    const onVisibility = () => setVisible((v) => (document.hidden ? false : v));
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (reduced || paused || !visible || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [reduced, paused, visible, count]);

  if (count === 0) return null;

  const active = campaigns[index]!;

  return (
    <section
      ref={sectionRef}
      className="container-x pt-16 md:pt-24"
      aria-roledescription={t('home.campaign.carousel')}
      aria-label={t('home.campaign.ariaLabel')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1);
        if (e.key === 'ArrowRight') go(index + 1);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      tabIndex={-1}
    >
      <div className="relative overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-700 ease-[var(--ease-out-expo)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {campaigns.map((c, i) => (
            <article
              key={c.id}
              className="relative w-full flex-none"
              aria-hidden={i !== index}
              inert={i !== index}
              aria-roledescription={t('home.campaign.slide')}
              aria-label={`${i + 1} / ${count}`}
            >
              <div className="relative aspect-[4/3] w-full bg-surface-2 sm:aspect-[16/7]">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.title}
                    fill
                    sizes="100vw"
                    priority={i === 0}
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-surface-2" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
                  <h2 className="max-w-2xl text-2xl font-medium tracking-tight text-white md:text-4xl">{c.title}</h2>
                  {c.description && (
                    <p className="mt-3 max-w-xl text-sm text-white/80 md:text-base">{c.description}</p>
                  )}
                  {c.linkUrl && (
                    <Link
                      href={c.linkUrl}
                      className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-[#111] transition-transform hover:-translate-y-0.5"
                    >
                      {c.linkLabel || t('home.campaign.readMore')} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={t('home.campaign.prev')}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#111] backdrop-blur transition-colors hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={t('home.campaign.next')}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#111] backdrop-blur transition-colors hover:bg-white"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {campaigns.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => go(i)}
              aria-label={t('home.campaign.goto').replace('{n}', String(i + 1))}
              aria-current={i === index}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === index ? 'w-8 bg-foreground' : 'w-3 bg-border-strong hover:bg-muted',
              )}
            />
          ))}
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {active.title}
      </span>
    </section>
  );
}

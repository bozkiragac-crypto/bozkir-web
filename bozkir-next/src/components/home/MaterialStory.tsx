'use client';

import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/types/category';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface MaterialStoryProps {
  categories: Category[];
}

/**
 * "Malzemeyi Keşfet" — CSS sticky + ScrollTrigger scrub.
 * Aktif kategori görseli yumuşak bir büyüme (Ken Burns) ile değişir.
 * Mobilde native dikey akış.
 */
export function MaterialStory({ categories }: MaterialStoryProps) {
  const items = categories.filter((c) => c.featured).slice(0, 6);
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { t } = useDictionary();

  useEffect(() => {
    if (items[active]) track('product_view', { category: items[active]!.slug, source: 'material_story' });
  }, [active, items]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const panel = el.querySelector('[data-panel]');
      const count = items.length;

      const st = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: `+=${count * 90}%`,
          scrub: 0.6,
          onUpdate: (self) => {
            const idx = Math.min(count - 1, Math.floor(self.progress * count));
            setActive((prev) => (prev === idx ? prev : idx));
          },
        },
      });

      // Panel scroll boyunca hafif büyür ve döner (abartısız).
      if (panel) {
        st.fromTo(panel, { scale: 0.94, rotate: -1.2 }, { scale: 1.03, rotate: 0.4, ease: 'none' });
      }

      return () => st.kill();
    },
    { scope: root, dependencies: [items.length] },
  );

  const current = items[active];

  if (items.length === 0) return null;

  return (
    <section ref={root} className="relative bg-background">
      <div className="container-x pt-24 md:pt-32">
        <p className="text-eyebrow">{t('home.story.eyebrow')}</p>
        <h2 className="text-headline mt-4 max-w-3xl">{t('home.story.title')}</h2>
      </div>

      {/* Sticky alan: yüksekliği kategori sayısı belirler */}
      <div className="relative" style={{ height: `${items.length * 90}vh` }}>
        <div className="sticky top-0 flex min-h-svh items-center overflow-clip py-12 lg:h-svh lg:py-0">
          <div className="container-x grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div className="order-2 lg:order-1">
              <div className="flex gap-2">
                {items.map((c, i) => (
                  <span
                    key={c.id}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-500',
                      i <= active ? 'bg-foreground' : 'bg-border',
                    )}
                  />
                ))}
              </div>

              <p className="numerals mt-4 text-xs tracking-[0.2em] text-muted lg:mt-6">
                {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </p>
              <h3
                key={current?.id}
                className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl lg:mt-3 lg:text-[clamp(1.9rem,3.2vw,3.1rem)] lg:leading-[1.05]"
              >
                {current?.name}
              </h3>
              <p className="mt-3 line-clamp-3 max-w-md text-sm leading-relaxed text-muted-strong lg:mt-5 lg:text-base">
                {current?.description}
              </p>

              <Link
                href={`/kategoriler/${current?.slug ?? ''}`}
                className="group mt-5 inline-flex items-center gap-2 text-sm font-medium lg:mt-7"
              >
                {t('home.story.collectionCta')}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100" />
              </Link>

              <dl className="mt-8 hidden max-w-md grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 text-sm lg:grid">
                <div>
                  <dt className="text-xs tracking-[0.14em] text-muted uppercase">{t('home.story.categoryLabel')}</dt>
                  <dd className="mt-1">{current?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.14em] text-muted uppercase">{t('home.story.applicationLabel')}</dt>
                  <dd className="mt-1">{t('home.story.applicationValue')}</dd>
                </div>
              </dl>
            </div>

            <div className="order-1 lg:order-2">
              <div
                data-panel
                className="relative h-[36svh] min-h-[200px] w-full overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-[0_50px_120px_-60px_rgba(0,0,0,0.55)] will-change-transform sm:h-[46svh] lg:h-[min(64svh,660px)]"
              >
                {items.map((c, i) => (
                  <div
                    key={c.id}
                    className={cn(
                      'absolute inset-0 transition-[opacity,transform] duration-[1100ms] ease-[var(--ease-out-expo)]',
                      i === active ? 'scale-105 opacity-100' : 'scale-100 opacity-0',
                    )}
                    aria-hidden={i !== active}
                  >
                    {c.heroImage ? (
                      <Image
                        src={c.heroImage}
                        alt={c.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">{t('home.story.imageSoon')}</div>
                    )}
                  </div>
                ))}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/40 px-4 py-1.5 text-[0.68rem] tracking-[0.14em] text-white/90 uppercase backdrop-blur-sm lg:bottom-5 lg:left-5">
                  {current?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

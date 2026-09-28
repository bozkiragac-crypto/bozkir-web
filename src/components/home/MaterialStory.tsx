'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Category } from '@/types/category';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

interface MaterialStoryProps {
  categories: Category[];
}

/**
 * "Malzemeyi Keşfet" — CSS sticky + ScrollTrigger scrub.
 * Panel büyür, aktif kategori metni değişir. Mobilde native dikey akış.
 */
export function MaterialStory({ categories }: MaterialStoryProps) {
  const items = categories.filter((c) => c.featured).slice(0, 6);
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items[active]) track('product_view', { category: items[active].slug, source: 'material_story' });
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
        st.fromTo(panel, { scale: 0.92, rotate: -1.5 }, { scale: 1.04, rotate: 0.5, ease: 'none' });
      }

      return () => st.kill();
    },
    { scope: root, dependencies: [items.length] },
  );

  const current = items[active];

  return (
    <section ref={root} className="relative bg-background">
      <div className="container-x pt-24 md:pt-32">
        <p className="text-eyebrow">Malzemeyi Keşfet</p>
        <h2 className="text-headline mt-4 max-w-3xl">Yüzeyden yapıya, her katmanı tanıyın.</h2>
      </div>

      {/* Sticky alan: yüksekliği kategori sayısı belirler */}
      <div className="relative" style={{ height: `${items.length * 90}vh` }}>
        <div className="sticky top-0 flex h-svh items-center overflow-clip">
          <div className="container-x grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div className="order-2 lg:order-1">
              <div className="flex gap-3">
                {items.map((c, i) => (
                  <span
                    key={c.id}
                    className={cn(
                      'h-px flex-1 transition-colors duration-500',
                      i <= active ? 'bg-foreground' : 'bg-border',
                    )}
                  />
                ))}
              </div>

              <p className="numerals mt-8 text-xs tracking-[0.2em] text-muted">
                {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </p>
              <h3 key={current?.id} className="mt-4 text-4xl font-medium tracking-tight md:text-6xl">
                {current?.name}
              </h3>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-strong">{current?.description}</p>

              <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-8 text-sm">
                <div>
                  <dt className="text-xs tracking-[0.14em] text-muted uppercase">Kategori</dt>
                  <dd className="mt-1">{current?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.14em] text-muted uppercase">Uygulama</dt>
                  <dd className="mt-1">Mobilya & iç mekân</dd>
                </div>
              </dl>
            </div>

            <div className="order-1 lg:order-2">
              <div
                data-panel
                className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-2 shadow-[0_40px_90px_-50px_rgba(0,0,0,.5)] will-change-transform"
              >
                {items.map((c, i) => (
                  <div
                    key={c.id}
                    className={cn(
                      'absolute inset-0 transition-opacity duration-700 ease-[var(--ease-out-expo)]',
                      i === active ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden={i !== active}
                  >
                    {c.heroImage ? (
                      <Image src={c.heroImage} alt={c.name} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted">Görsel hazırlanıyor</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

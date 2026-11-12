'use client';

import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { Container } from '@/components/ui/Container';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/types/category';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { STORY_STEP_VH } from '@/lib/motion';
import { track } from '@/lib/analytics';
import { ChapterMark } from '@/components/ui/ChapterMark';
import { Panel3D } from '@/components/three/Panel3D';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface MaterialStoryProps {
  categories: Category[];
}

/**
 * "Malzemeyi Keşfet" — masaüstünde CSS sticky + ScrollTrigger scrub,
 * mobilde yatay kaydırmalı kart akışı (pinning yok).
 * Bölüm sonunda panel kesiti (3D) yer alır; 3D tüm kırılımlarda çalışır,
 * görünür alana girince yüklenir.
 */
export function MaterialStory({ categories }: MaterialStoryProps) {
  const items = useMemo(() => categories.filter((c) => c.featured).slice(0, 6), [categories]);
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { t } = useDictionary();

  useEffect(() => {
    if (items[active])
      track('product_view', { category: items[active]!.slug, source: 'material_story' });
  }, [active, items]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Zaman çizelgesi bölümün tamamına değil, sticky sahneye bağlanır:
      // ilerleme 0→1 tam olarak pin ömrüne denk gelir; son kategori sahne
      // kaymadan önce tamamlanır.
      const stage = el.querySelector('[data-story-stage]');
      const panel = el.querySelector('[data-panel]');
      if (!stage) return;
      const count = items.length;

      const st = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
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
    <section ref={root} id="malzeme" className="relative bg-background">
      <Container className="pad-scene pb-0">
        <ChapterMark label={t('home.story.eyebrow')} />
        <h2 className="text-section mt-4 max-w-3xl">{t('home.story.title')}</h2>
      </Container>

      {/* Mobil: yatay kaydırma — pinning yok, kartlar kısmi görünür (keşfedilebilirlik). */}
      <div className="mt-10 lg:hidden">
        <div className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)]">
          {items.map((c) => (
            <article key={c.id} className="w-[78vw] max-w-[320px] flex-none snap-start">
              <Link href={`/kategoriler/${c.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-surface-2">
                  {c.heroImage ? (
                    <Image
                      src={c.heroImage}
                      alt={c.name}
                      fill
                      sizes="78vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">
                      {t('home.story.imageSoon')}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className="absolute bottom-3 start-3 rounded-full bg-black/45 px-3 py-1 text-[0.75rem] tracking-[0.14em] text-white/90 uppercase backdrop-blur-sm">
                    {c.name}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-medium tracking-tight">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-strong">
                  {c.description}
                </p>
              </Link>
              <Link
                href={`/urunler?kategori=${c.slug}`}
                className="tap-target mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-strong transition-colors hover:text-foreground"
              >
                {t('home.story.productsCta')}
                <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </Link>
            </article>
          ))}
        </div>
      </div>

      {/* Masaüstü: sticky sahne (ScrollTrigger bu sahneye bağlı) */}
      <div
        data-story-stage
        className="relative hidden lg:block"
        style={{ height: `${items.length * STORY_STEP_VH}vh` }}
      >
        <div className="sticky top-0 flex min-h-svh items-center overflow-clip py-12 lg:h-svh lg:py-0">
          <Container className="grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div className="order-2 lg:order-1">
              {/* Editoryal indeks (lg+) — aktif satır vurgulanır */}
              <ul className="hidden flex-col lg:flex">
                {items.map((c, i) => {
                  const on = i === active;
                  return (
                    <li key={c.id} aria-current={on ? 'true' : undefined}>
                      <div className="flex items-baseline gap-4 border-b border-border py-3">
                        <span
                          className={cn(
                            'numerals text-xs tracking-[0.2em] transition-colors duration-500',
                            on ? 'text-foreground' : 'text-muted',
                          )}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={cn(
                            'font-display tracking-tight transition-all duration-500 ease-[var(--ease-out-expo)]',
                            on
                              ? 'text-[clamp(1.6rem,2.6vw,2.4rem)] leading-[1.05] text-foreground'
                              : 'text-lg text-muted-strong',
                          )}
                        >
                          {c.name}
                        </span>
                        <ArrowRight
                          className={cn(
                            'ms-auto h-4 w-4 flex-none text-foreground transition-all duration-500 ease-[var(--ease-out-expo)]',
                            on ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0',
                          )}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-5 line-clamp-3 max-w-md text-sm leading-relaxed text-muted-strong lg:mt-6 lg:text-base">
                {current?.description}
              </p>

              <Link
                href={`/kategoriler/${current?.slug ?? ''}`}
                className="tap-target group mt-5 inline-flex items-center gap-2 text-sm font-medium lg:mt-7"
              >
                {t('home.story.collectionCta')}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100" />
              </Link>

              <Link
                href={`/urunler?kategori=${current?.slug ?? ''}`}
                className="tap-target mt-3 flex w-fit items-center gap-2 text-sm text-muted-strong transition-colors hover:text-foreground lg:mt-4"
              >
                {t('home.story.productsCta')}
                <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </Link>

              <dl className="mt-8 hidden max-w-md grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 text-sm lg:grid">
                <div>
                  <dt className="text-xs tracking-[0.14em] text-muted uppercase">
                    {t('home.story.categoryLabel')}
                  </dt>
                  <dd className="mt-1">{current?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.14em] text-muted uppercase">
                    {t('home.story.applicationLabel')}
                  </dt>
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
                      <div className="flex h-full items-center justify-center text-sm text-muted">
                        {t('home.story.imageSoon')}
                      </div>
                    )}
                  </div>
                ))}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="pointer-events-none absolute bottom-4 start-4 rounded-full bg-black/40 px-4 py-1.5 text-[0.75rem] tracking-[0.14em] text-white/90 uppercase backdrop-blur-sm lg:bottom-5 lg:start-5">
                  {current?.name}
                </span>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* Panel kesiti — eski ayrı "Material3D" bölümü artık burada yaşıyor. */}
      <div className="pad-compact border-t border-border">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-eyebrow">{t('home.material3d.eyebrow')}</p>
            <h3 className="text-section mt-4">{t('home.material3d.title')}</h3>
            <p className="mt-6 max-w-lg leading-relaxed text-muted-strong">
              {t('home.material3d.body')}
            </p>
            <p className="mt-4 text-caption">{t('home.material3d.hint')}</p>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -inset-y-6 -z-10 rounded-[2.5rem] bg-[color:var(--color-accent-soft)]/12 blur-2xl"
            />
            <div className="h-[420px] overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2 shadow-[var(--card-shadow)] sm:h-[460px] lg:h-[min(52svh,480px)]">
              <Panel3D />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

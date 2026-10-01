'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useDictionary } from '@/i18n/DictionaryProvider';

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const { t } = useDictionary();

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        gsap.set('[data-hero-item]', { opacity: 1, y: 0 });
        return;
      }

      // Giriş: yalnızca İÇ katmanda scale/opacity (scroll parallax'ıyla çakışmaz).
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
      tl.from('[data-hero-media]', { scale: 1.12, opacity: 0, duration: 1.2 })
        .from('[data-hero-item]', { y: 28, opacity: 0, stagger: 0.08 }, 0.15);

      // Scroll: yalnızca DIŞ katmanda hafif dikey parallax (zoom yok).
      gsap.to('[data-hero-parallax]', {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      gsap.to('[data-hero-copy]', {
        yPercent: -12,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-on-dark className="relative isolate min-h-svh overflow-clip bg-[#111] text-white">
      <div data-hero-parallax className="absolute inset-0 -z-20 will-change-transform">
        <div data-hero-media className="absolute inset-0">
          <Image
            src="/images/hero-showroom.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_45%]"
          />
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,12,.66)_0%,rgba(10,10,12,.38)_42%,rgba(10,10,12,.8)_100%),linear-gradient(90deg,rgba(10,10,12,.6)_0%,rgba(10,10,12,.1)_60%,rgba(10,10,12,0)_100%)]"
        aria-hidden
      />

      <div className="container-x relative flex min-h-svh flex-col justify-end pb-20 pt-[var(--header-height)] md:pb-32">
        <div data-hero-copy className="max-w-4xl">
          <p data-hero-item className="text-eyebrow text-white/75">
            {t('home.hero.eyebrow')}
          </p>
          <h1 data-hero-item className="text-hero mt-6 text-white">
            {t('home.hero.titleLead')}{' '}
            <span className="relative inline-block text-[color:var(--color-accent-soft)]">
              <span className="text-hand">{t('home.hero.titleAccent')}</span>
              <svg
                aria-hidden
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2 w-full text-[color:var(--color-accent-soft)]/65 md:-bottom-2 md:h-3"
              >
                <path
                  d="M2 8C40 2 80 12 120 6s58-5 76-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p data-hero-item className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
            {t('home.hero.intro')}
          </p>
          <div data-hero-item className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <MagneticButton className="[&>a]:w-full sm:[&>a]:w-auto">
              <ButtonLink href="/urunler" size="lg" className="w-full justify-center bg-white text-[#111] hover:bg-white/90 sm:w-auto">
                {t('home.hero.ctaProducts')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
              </ButtonLink>
            </MagneticButton>
            <ButtonLink
              href="/teklif-al"
              size="lg"
              variant="outline"
              className="w-full justify-center border-white/40 text-white hover:border-white hover:bg-white hover:text-[#111] sm:w-auto"
            >
              {t('home.hero.ctaQuote')}
            </ButtonLink>
          </div>
        </div>

        <div data-hero-item className="mt-16 flex items-center gap-3 text-xs tracking-[0.24em] text-white/60 uppercase">
          <ArrowDown className="h-4 w-4 animate-bounce" />
          {t('home.hero.scroll')}
        </div>
      </div>
    </section>
  );
}

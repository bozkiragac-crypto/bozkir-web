'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        gsap.set('[data-hero-item]', { opacity: 1, y: 0 });
        return;
      }

      // Giriş: hafif stagger (ağır intro yok, içerik hızlı görünür).
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
      tl.from('[data-hero-media]', { scale: 1.12, opacity: 0, duration: 1.2 })
        .from('[data-hero-item]', { y: 28, opacity: 0, stagger: 0.08 }, 0.15);

      // Scroll: görsel küçülür, başlık hafifçe yukarı kayar.
      gsap.to('[data-hero-media]', {
        scale: 1.06,
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('[data-hero-copy]', {
        yPercent: -12,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative isolate min-h-svh overflow-clip bg-[#111] text-white">
      <div data-hero-media className="absolute inset-0 -z-20 will-change-transform">
        <Image
          src="/images/hero-showroom.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_45%]"
        />
      </div>
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,12,.66)_0%,rgba(10,10,12,.38)_42%,rgba(10,10,12,.8)_100%),linear-gradient(90deg,rgba(10,10,12,.6)_0%,rgba(10,10,12,.1)_60%,rgba(10,10,12,0)_100%)]"
        aria-hidden
      />

      <div className="container-x relative flex min-h-svh flex-col justify-end pb-28 pt-[var(--header-height)] md:pb-32">
        <div data-hero-copy className="max-w-4xl">
          <p data-hero-item className="text-eyebrow text-white/75">
            {"Antakya · 1979'dan beri"}
          </p>
          <h1 data-hero-item className="text-display mt-6 text-white">
            Malzemenin <em className="font-normal not-italic text-[color:var(--color-accent-soft)]">yeni formu.</em>
          </h1>
          <p data-hero-item className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">
            Mobilya ve iç mekân üreticileri için panel, yüzey ve tamamlayıcı çözümler.
          </p>
          <div data-hero-item className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton>
              <ButtonLink href="/urunler" size="lg" className="bg-white text-[#111] hover:bg-white/90">
                Ürünleri Keşfet <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
            </MagneticButton>
            <ButtonLink
              href="/teklif-al"
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:border-white hover:bg-white hover:text-[#111]"
            >
              Teklif Al
            </ButtonLink>
          </div>
        </div>

        <div data-hero-item className="mt-16 flex items-center gap-3 text-xs tracking-[0.24em] text-white/60 uppercase">
          <ArrowDown className="h-4 w-4 animate-bounce" />
          Keşfetmek için kaydır
        </div>
      </div>
    </section>
  );
}

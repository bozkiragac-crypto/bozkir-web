'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

const milestones = [
  { year: '1979', title: 'Sektör tecrübesinin başlangıcı', text: 'Bozkır ailesinin mobilya ve ahşap sektöründeki ticari faaliyetleri başladı.' },
  { year: '2016', title: 'Bozkır Ağaç Ürünleri', text: 'İbrahim Bozkır ve oğulları İlker ve Hakan Bozkır öncülüğünde kurumsal yapı kuruldu.' },
  { year: 'Bugün', title: 'Geniş ürün gamı', text: 'MDF, sunta, lake panel ve yardımcı ürün gruplarında güçlü stok ve hızlı tedarik.' },
];

export function AboutTimeline() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const line = root.current?.querySelector('[data-line]');
      if (!line) return;
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top center',
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom 80%', scrub: true },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="container-x py-24 md:py-32">
      <p className="text-eyebrow">Hakkımızda</p>
      <h2 className="text-headline mt-4 max-w-2xl">Köklü bir tecrübe, modern bir yapı.</h2>

      <div className="relative mt-16 pl-8 md:pl-0">
        <div data-line className="absolute left-0 top-0 h-full w-px bg-foreground/20 md:left-[calc(20%_-_1px)]" />
        <ol className="space-y-16">
          {milestones.map((m) => (
            <li key={m.year} className="md:grid md:grid-cols-[20%_1fr] md:gap-10">
              <div className="relative">
                <span className="numerals text-3xl font-medium tracking-tight md:text-4xl">{m.year}</span>
              </div>
              <div className="mt-3 max-w-xl md:mt-0">
                <h3 className="text-xl font-medium tracking-tight">{m.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-strong">{m.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

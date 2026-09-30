'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { useDictionary } from '@/i18n/DictionaryProvider';

/** Yalnızca doğrulanabilir sayılar: kuruluş, kurumsallaşma, ürün grubu, yetkili marka. */
export function StatsBand() {
  const { dict } = useDictionary();
  const stats = dict.pages.about.stats;
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const els = root.current?.querySelectorAll('[data-count]');
      if (!els) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      els.forEach((el) => {
        const target = Number(el.getAttribute('data-count'));
        const start = target > 1000 ? target - 60 : 0;
        const obj = { v: start };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: 'power2.out',
          snap: { v: 1 },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface p-6 md:p-8">
          <span data-count={s.value} className="numerals block text-4xl font-medium tracking-tight md:text-5xl">
            {s.value}
          </span>
          <span className="mt-3 block text-xs tracking-[0.14em] text-muted uppercase">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

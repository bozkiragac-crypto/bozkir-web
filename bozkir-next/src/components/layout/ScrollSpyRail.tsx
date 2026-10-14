'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Ana sayfa bölüm göstergesi: sağ kenarda scroll-spy noktaları (xl+).
 * Aktif bölüm, kaydırma konumuna göre hesaplanır (referans çizgisinin üstündeki
 * en yakın bölüm) → sayfa alt/üst uçlarında "takılı kalma" olmaz.
 */
export function ScrollSpyRail({
  items,
  ariaLabel,
}: {
  items: { id: string; label: string }[];
  ariaLabel: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => e !== null);
    if (els.length === 0) return;

    setActive(els[0]!.id);

    let ticking = false;
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.4;
      // Referans çizgisinin üstündeki son bölüm aktif; hiçbiri yoksa ilk bölüm.
      let current = els[0]!.id;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  return (
    <nav
      aria-label={ariaLabel}
      className="no-print pointer-events-none fixed end-4 top-1/2 z-[70] hidden -translate-y-1/2 xl:block"
    >
      <ul className="pointer-events-auto flex flex-col items-end gap-3">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={isActive ? 'true' : undefined}
                className="group flex items-center gap-2"
              >
                <span
                  className={cn(
                    'text-[0.6rem] tracking-[0.14em] uppercase transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-70',
                  )}
                >
                  {it.label}
                </span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full border transition-all duration-300',
                    isActive
                      ? 'scale-125 border-foreground bg-foreground'
                      : 'border-border-strong group-hover:border-foreground',
                  )}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

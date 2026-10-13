'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/** Ana sayfa bölüm göstergesi: sağ kenarda scroll-spy noktaları (xl+). */
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

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
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

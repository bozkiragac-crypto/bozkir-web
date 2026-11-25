'use client';

import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export type ContactMapItem = {
  id: string;
  label: string;
  coords: string;
  mapTitle: string;
};

/**
 * Mobil/tablet harita seçici: iki büyük Google Maps iframe'ini üst üste
 * yüklemek yerine tek harita + sekme gösterir. Masaüstünde (lg+) bölüm
 * içindeki haritalar kullanılır, bu bileşen gizlenir.
 */
export function ContactMapTabs({
  items,
  ariaLabel,
}: {
  items: ContactMapItem[];
  ariaLabel: string;
}) {
  const [active, setActive] = useState(0);
  const available = items.filter((i) => i.coords.trim());
  if (available.length === 0) return null;

  const current = available[Math.min(active, available.length - 1)]!;

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = available.length - 1;
    let next = active;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = active === last ? 0 : active + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = active === 0 ? last : active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setActive(next);
    const el = document.getElementById(`map-tab-${available[next]!.id}`);
    el?.focus();
  }

  return (
    <div className="mt-8 lg:hidden">
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="flex gap-1 rounded-full border border-border bg-surface p-1"
      >
        {available.map((item, i) => (
          <button
            key={item.id}
            id={`map-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`map-panel-${item.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={cn(
              'h-11 flex-1 rounded-full px-4 text-sm font-medium transition-colors',
              i === active
                ? 'bg-foreground text-background'
                : 'text-muted-strong hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        key={current.id}
        id={`map-panel-${current.id}`}
        role="tabpanel"
        aria-labelledby={`map-tab-${current.id}`}
        className="relative mt-3 overflow-hidden rounded-xl border border-border shadow-[var(--card-shadow)]"
      >
        <iframe
          title={current.mapTitle}
          src={`https://www.google.com/maps?q=${encodeURIComponent(current.coords)}&output=embed`}
          className="h-[260px] w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

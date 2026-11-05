'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface UsageTabsProps {
  items: { id: string; label: string }[];
  children: ReactNode[];
  ariaLabel: string;
}

/** Uygulama alanları / seçim rehberi sekmeleri (klavye destekli). */
export function UsageTabs({ items, children, ariaLabel }: UsageTabsProps) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {items.map((item, i) => {
          const on = i === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={on}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  focusTab(i + 1);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  focusTab(i - 1);
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  focusTab(0);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  focusTab(items.length - 1);
                }
              }}
              className={cn(
                'relative -mb-px border-b-2 px-4 py-3 text-sm font-medium tracking-tight transition-colors',
                on
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item, i) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={i !== active}
          className="pt-10"
        >
          {children[i]}
        </div>
      ))}
    </div>
  );
}

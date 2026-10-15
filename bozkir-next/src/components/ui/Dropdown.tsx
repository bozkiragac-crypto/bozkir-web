'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Yumuşak köşeli, özel açılır seçici (native `<select>` yerine).
 *
 * Native select'in işletim sistemi popup'ı keskin köşeli ve tema dışı
 * kalabildiği için (özellikle Windows'ta metin okunmuyor), bu bileşen kendi
 * `<ul>`'unu `bg-surface text-foreground` ile render eder. Klavye (ok/Enter/Esc)
 * ve dış tıklama ile kapanma desteklenir.
 */
export function Dropdown({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  align = 'end',
  size = 'md',
  triggerClassName,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  ariaLabel: string;
  className?: string;
  align?: 'start' | 'end';
  size?: 'sm' | 'md';
  triggerClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const sm = size === 'sm';

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex < 0 ? 0 : selectedIndex];

  useEffect(() => {
    if (!open) return;
    setActive(selectedIndex < 0 ? 0 : selectedIndex);
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, selectedIndex]);

  function choose(i: number) {
    const opt = options[i];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    }
  }

  return (
    <div ref={ref} className={cn('relative inline-block', className)} onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-full border border-border text-foreground transition-colors hover:bg-surface-2 focus-visible:border-foreground disabled:opacity-50',
          sm ? 'h-9 ps-3 pe-2.5 text-xs' : 'h-11 ps-4 pe-3 text-sm',
          triggerClassName,
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={cn(
            'flex-none text-muted transition-transform duration-200',
            sm ? 'h-3.5 w-3.5' : 'h-4 w-4',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            'absolute top-full z-[120] mt-2 w-full min-w-[12rem] overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]',
            'max-w-[calc(100vw-2rem)]',
            align === 'start' ? 'start-0' : 'end-0',
          )}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value || '__all'} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl text-start transition-colors',
                    sm ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm',
                    i === active ? 'bg-surface-2' : 'hover:bg-surface-2',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 flex-none" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

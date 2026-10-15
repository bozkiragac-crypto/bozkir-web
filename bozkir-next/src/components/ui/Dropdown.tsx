'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** SSR'da `useLayoutEffect` uyarısını önlemek için izomorfik sürüm. */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Yumuşak köşeli, özel açılır seçici (native `<select>` yerine).
 *
 * Liste, kırpılmayı önlemek için `document.body`'ye **portal** edilir ve
 * `position: fixed` ile tetikleyicinin altına/üstüne konumlanır (yer yoksa
 * yukarı açılır). Böylece `overflow` konteynerleri (tablo sarmalayıcıları vb.)
 * listeyi kesmez; kaydırma gerekmez. Klavye (ok/Enter/Esc) ve dış tıklama
 * ile kapanma desteklenir.
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const sm = size === 'sm';

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex < 0 ? 0 : selectedIndex];

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const estH = listRef.current?.offsetHeight || Math.min(options.length * 40 + 8, 320);
    const spaceBelow = window.innerHeight - r.bottom - gap;
    const openUp = spaceBelow < estH && r.top - gap > spaceBelow;
    const width = Math.max(r.width, 192);
    let left = align === 'start' ? r.left : r.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const top = openUp ? Math.max(gap, r.top - estH - gap) : r.bottom + gap;
    setPos({ top, left, width });
  }, [align, options.length]);

  useIsoLayoutEffect(() => {
    if (!open) return;
    setActive(selectedIndex < 0 ? 0 : selectedIndex);
    update();
    // Liste ölçüldükten sonra (flip kararı için) tekrar konumlandır.
    const raf = requestAnimationFrame(update);
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, selectedIndex, update]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

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
    <div className={cn('relative inline-block', className)} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
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

      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
            className="z-[300] max-h-[min(20rem,60vh)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]"
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
          </ul>,
          document.body,
        )}
    </div>
  );
}

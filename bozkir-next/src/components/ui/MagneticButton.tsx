'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

const MAX_OFFSET = 3;

/**
 * CTA butonlarında hafif "magnetic" etki. Dokunmatik ve
 * prefers-reduced-motion durumlarında devre dışı.
 */
export function MagneticButton({ children, className, strength = 0.14 }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);

  function isDisabled() {
    return (
      window.matchMedia('(hover: none), (pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || isDisabled()) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (e.clientX - rect.left - rect.width / 2) * strength));
    const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (e.clientY - rect.top - rect.height / 2) * strength));
    el.style.transitionDuration = '40ms';
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDuration = '420ms';
    el.style.transform = 'translate3d(0,0,0)';
  }

  return (
    <span
      ref={ref}
      className={cn('inline-block transition-transform duration-[420ms] ease-[var(--ease-out-expo)]', className)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onBlur={reset}
    >
      {children}
    </span>
  );
}

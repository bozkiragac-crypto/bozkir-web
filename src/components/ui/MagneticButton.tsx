'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

/**
 * CTA butonlarında hafif "magnetic" etki. Dokunmatik ve
 * prefers-reduced-motion durumlarında devre dışı.
 */
export function MagneticButton({ children, className, strength = 0.25 }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function reset() {
    const el = ref.current;
    if (el) el.style.transform = 'translate3d(0,0,0)';
  }

  return (
    <span
      ref={ref}
      className={cn('inline-block transition-transform duration-500 ease-[var(--ease-out-expo)]', className)}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      {children}
    </span>
  );
}

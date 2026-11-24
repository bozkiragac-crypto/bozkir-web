'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Masaüstünde fare imlecini gecikmeli takip eden küçük yuvarlak nokta.
 * Touch/coarse pointer ve reduced-motion cihazlarında gösterilmez.
 */
export function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    setEnabled(true);

    const render = () => {
      const el = dotRef.current;
      if (!el) {
        rafRef.current = null;
        return;
      }

      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * 0.14;
      current.current.y += dy * 0.14;
      el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafRef.current = window.requestAnimationFrame(render);
      } else {
        current.current.x = target.current.x;
        current.current.y = target.current.y;
        el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
        rafRef.current = null;
      }
    };

    const schedule = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(render);
    };

    const show = () => {
      if (visibleRef.current) return;
      visibleRef.current = true;
      setVisible(true);
    };

    const hide = () => {
      if (!visibleRef.current) return;
      visibleRef.current = false;
      setVisible(false);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      target.current = { x: event.clientX, y: event.clientY };
      if (!visibleRef.current) {
        current.current = { ...target.current };
        const el = dotRef.current;
        if (el) {
          el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
        }
      }
      show();
      schedule();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('blur', hide);
    document.documentElement.addEventListener('mouseleave', hide);

    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('blur', hide);
      document.documentElement.removeEventListener('mouseleave', hide);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      data-cursor-dot
      className="no-print pointer-events-none fixed left-0 top-0 z-[220] h-4 w-4 rounded-full bg-foreground/12 shadow-[0_2px_10px_rgba(0,0,0,0.06)] backdrop-blur-[1px] transition-opacity duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    />
  );
}

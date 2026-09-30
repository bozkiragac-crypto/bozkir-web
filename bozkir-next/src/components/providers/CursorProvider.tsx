'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Global özel imleç: anlık takip eden nokta + gecikmeli halka + etiket.
 * Yalnızca ince işaretçili (masaüstü) cihazlarda ve reduced-motion kapalıyken.
 * Performans: transform-only yazımlar + will-change; DOM yalnızca değer değişince
 * güncellenir ve pointer hareketsizken rAF duraklatılır.
 */
export function CursorProvider() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    setEnabled(true);
    const root = document.documentElement;
    root.classList.add('has-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let hover = false;
    let label = '';
    let pressed = false;
    let raf = 0;
    let running = false;
    let idleTimer = 0;

    const apply = (force: boolean) => {
      // Etiket metnini yalnızca değiştiğinde yaz (layout thrash'i önler).
      if (labelRef.current) {
        if (force || labelRef.current.textContent !== label) {
          labelRef.current.textContent = label;
        }
        labelRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        labelRef.current.style.opacity = label && hover ? '1' : '0';
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        dotRef.current.style.opacity = label && hover ? '0' : '1';
      }
      if (ringRef.current) {
        const scale = (pressed ? 0.85 : 1) * (hover ? 1.5 : 1);
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
        ringRef.current.style.opacity = label && hover ? '0' : hover ? '1' : '0.5';
      }
    };

    const tick = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.18;
      ringY += dy * 0.18;
      apply(false);
      // Halka noktaya yeterince yaklaştıysa ve hover/etiket yoksa döngüyü durdur.
      const settled = Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2 && !hover && !label;
      if (settled) {
        running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (e.pointerType !== 'mouse') return;
      const target = (e.target as HTMLElement)?.closest?.(
        'a, button, [role="button"], [data-cursor-label], [data-cursor]',
      ) as HTMLElement | null;
      const textField = (e.target as HTMLElement)?.closest?.('input, textarea, select') as HTMLElement | null;

      const nextHover = !!target && !textField;
      const nextLabel = target?.getAttribute('data-cursor-label') ?? '';

      // Sınıfı yalnızca durum değişince değiştir (global stil invalidasyonunu azaltır).
      root.classList.toggle('cursor-native', !!textField);
      hover = nextHover;
      label = nextLabel;

      start();

      // Hareket durduktan sonra rAF'i durdur (idle).
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (running && !hover && !label) {
          cancelAnimationFrame(raf);
          running = false;
          raf = 0;
        }
      }, 120);
    };

    const onDown = () => {
      pressed = true;
      start();
    };
    const onUp = () => {
      pressed = false;
    };
    const onLeave = () => {
      hover = false;
      label = '';
      apply(true);
    };
    const onVisibility = () => {
      if (document.hidden && running) {
        cancelAnimationFrame(raf);
        running = false;
        raf = 0;
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    // İlk konumu yerleştir (başlangıçta görünür nokta için).
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      root.classList.remove('has-cursor', 'cursor-native');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[188] h-6 w-6 rounded-full border border-black/50 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[190] h-1.5 w-1.5 rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={labelRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[189] whitespace-nowrap rounded-full bg-black px-3 py-1.5 text-[0.55rem] font-medium tracking-[0.14em] text-white uppercase opacity-0"
        style={{ willChange: 'transform, opacity' }}
      />
    </>
  );
}

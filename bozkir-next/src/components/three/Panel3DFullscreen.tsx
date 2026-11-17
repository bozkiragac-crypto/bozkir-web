'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { PanelViewer, type PanelFinish } from './PanelViewer';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useDictionary } from '@/i18n/DictionaryProvider';

/**
 * Mobilde satır içi panelin yerine açılan tam ekran 3D görüntüleyici.
 * Sayfa kaydırmasını kilitler, odağı içeride tutar ve Esc ile kapanır.
 */
export function Panel3DFullscreen({
  open,
  onClose,
  finish,
  finishes,
  onFinishChange,
  autoRotate = true,
}: {
  open: boolean;
  onClose: () => void;
  finish: PanelFinish;
  finishes: PanelFinish[];
  onFinishChange: (finish: PanelFinish) => void;
  autoRotate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { dict } = useDictionary();
  const h = dict.home.material3d;
  useFocusTrap(open, ref);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel3d-fullscreen-title"
      data-lenis-prevent
      className="fixed inset-0 z-[300] flex flex-col bg-background"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <div>
          <p className="text-[0.75rem] tracking-[0.14em] text-muted uppercase">{h.eyebrow}</p>
          <h2
            id="panel3d-fullscreen-title"
            className="mt-0.5 text-base font-medium tracking-tight"
          >
            {h.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.nav.close}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-border bg-background/85 transition-colors hover:border-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-gradient-to-b from-surface to-surface-2">
        <PanelViewer
          finish={finish}
          autoRotate={autoRotate}
          fitCamera
          dprMax={1.5}
          labels={{ zoomIn: h.zoomIn, zoomOut: h.zoomOut, reset: h.resetView }}
        />
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-6">
        <p className="text-[0.75rem] tracking-[0.14em] text-muted uppercase">{h.finishLabel}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {finishes.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFinishChange(f)}
              aria-pressed={finish.id === f.id}
              className={
                finish.id === f.id
                  ? 'inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium text-background'
                  : 'inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-strong transition-colors hover:border-border-strong hover:text-foreground'
              }
            >
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: f.color }}
              />
              {f.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-caption">{h.hint}</p>
      </div>
    </div>
  );
}

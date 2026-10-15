'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

/** Basit onay diyaloğu: odak tuzağı + ESC/arka plan ile kapanma + scroll kilidi. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Sil',
  busy = false,
  destructive = true,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {message && <div className="mt-2 text-sm text-muted-strong">{message}</div>}
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 rounded-full border border-border px-4 text-sm disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={
              destructive
                ? 'inline-flex h-10 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50'
                : 'inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50'
            }
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

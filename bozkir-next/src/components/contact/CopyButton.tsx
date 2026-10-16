'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';

/** Panoya kopyalama butonu (clipboard API + eski tarayıcı fallback). */
export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const toast = useToast();
  const [done, setDone] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setDone(true);
      toast(copiedLabel);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // yok say (kopyalanamadı)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-strong transition-colors hover:border-foreground hover:text-foreground',
        className,
      )}
    >
      {done ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </button>
  );
}

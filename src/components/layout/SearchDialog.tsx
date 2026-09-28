'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { track } from '@/lib/analytics';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
    setValue('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    track('search', { query: q });
    onClose();
    router.push(`/urunler?q=${encodeURIComponent(q)}`);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Site içi arama"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-5">
          <Search className="h-5 w-5 text-muted-strong" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ürün, kategori veya kod ara..."
            className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
            aria-label="Arama"
          />
          <button type="button" onClick={onClose} aria-label="Aramayı kapat" className="text-muted-strong hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between px-5 py-3 text-xs text-muted">
          <span>Aramak için Enter</span>
          <span className="hidden sm:inline">Kapatmak için Esc</span>
        </div>
      </form>
    </div>
  );
}

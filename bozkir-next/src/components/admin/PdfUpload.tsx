'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { uploadMedia } from '@/lib/admin/safe-actions';
import { MAX_PDF_MB } from '@/lib/media';

/** Katalog PDF'i yÃ¼kler; yÃ¼klenen dosyanÄ±n genel URL'ini tutar. */
export function PdfUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadMedia(fd, 'catalogs');
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.url) onChange(res.url);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs tracking-[0.14em] text-muted uppercase">Katalog PDF</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-border-strong px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {busy ? 'YÃ¼kleniyor...' : 'PDF YÃ¼kle'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
      </div>

      {value ? (
        <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3">
          <FileText className="h-5 w-5 flex-none text-muted-strong" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm underline underline-offset-4">
            {value}
          </a>
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="PDF kaldÄ±r"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-muted-strong hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">PDF yÃ¼klenmedi (en fazla {MAX_PDF_MB} MB).</p>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

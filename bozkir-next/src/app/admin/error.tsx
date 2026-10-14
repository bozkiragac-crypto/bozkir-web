'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] sayfa hatası:', error);
  }, [error]);

  return (
    <div className="rounded-xl border border-border bg-surface p-8">
      <div className="flex items-start gap-4">
        <AlertTriangle className="mt-0.5 h-6 w-6 flex-none text-danger" aria-hidden />
        <div className="min-w-0">
          <h1 className="text-lg font-medium">Bir şeyler ters gitti</h1>
          <p className="mt-1 text-sm text-muted-strong">
            Bu bölüm yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
          </p>
          {error.digest && (
            <p className="numerals mt-2 text-xs text-muted">Hata kodu: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Tekrar dene
          </button>
        </div>
      </div>
    </div>
  );
}

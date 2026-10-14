'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { clearActivityLog } from '@/lib/admin/safe-actions';

export function ClearActivityButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<number | null>(null);

  async function run() {
    if (!confirm('90 gÃ¼nden eski aktivite kayÄ±tlarÄ± kalÄ±cÄ± olarak silinecek. Devam edilsin mi?')) return;
    setBusy(true);
    setError('');
    setDone(null);
    const res = await clearActivityLog();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Temizlenemedi.');
      return;
    }
    setDone(res.deleted ?? 0);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-strong transition-colors hover:border-red-300 hover:text-danger disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Eski kayÄ±tlarÄ± temizle (90+ gÃ¼n)
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
      {done !== null && <span className="text-xs text-success">{done} kayÄ±t temizlendi.</span>}
    </div>
  );
}

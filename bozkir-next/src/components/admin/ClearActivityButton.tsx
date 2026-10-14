'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { clearActivityLog } from '@/lib/admin/safe-actions';
import { useToast } from '@/components/ui/ToastProvider';

export function ClearActivityButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const toast = useToast();

  async function run() {
    if (!confirm('90 günden eski aktivite kayıtları kalıcı olarak silinecek. Devam edilsin mi?'))
      return;
    setBusy(true);
    setError('');
    setDone(null);
    const res = await clearActivityLog();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Temizlenemedi.');
      toast(res.error ?? 'Temizlenemedi.');
      return;
    }
    setDone(res.deleted ?? 0);
    toast(`${res.deleted ?? 0} kayıt temizlendi.`);
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
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Eski kayıtları temizle (90+ gün)
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
      {done !== null && <span className="text-xs text-success">{done} kayıt temizlendi.</span>}
    </div>
  );
}

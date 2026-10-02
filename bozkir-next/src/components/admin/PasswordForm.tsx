'use client';

import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { changeOwnPassword } from '@/lib/admin/safe-actions';

const field =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-foreground';

export function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDone(false);
    if (next !== confirm) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    setBusy(true);
    const res = await changeOwnPassword(current, next);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Şifre değiştirilemedi.');
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(true);
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-md rounded-xl border border-border bg-surface p-5">
      <p className="flex items-center gap-2 font-medium">
        <KeyRound className="h-4 w-4" /> Şifre değiştir
      </p>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-1">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Mevcut şifre</span>
          <input
            className={field}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Yeni şifre (min 8)</span>
          <input
            className={field}
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Yeni şifre (tekrar)</span>
          <input
            className={field}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {done && (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Şifreniz güncellendi.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Şifreyi güncelle
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/app/admin/actions';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn(identifier.trim(), password, needsTotp ? totp.trim() : undefined);
    setLoading(false);
    if (res.requiresTotp) {
      setNeedsTotp(true);
      if (!res.ok) setError(res.error ?? null);
      return;
    }
    if (!res.ok) {
      setError(res.error ?? 'Giriş yapılamadı.');
      return;
    }
    router.replace('/admin');
    router.refresh();
  }

  const field =
    'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-xs tracking-[0.14em] text-muted uppercase">Kullanıcı adı</span>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className={field}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>
      <label className="grid gap-2">
        <span className="text-xs tracking-[0.14em] text-muted uppercase">Şifre</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={field}
          autoComplete="current-password"
        />
      </label>
      {needsTotp && (
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Doğrulama kodu (2FA)</span>
          <input
            type="text"
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 haneli kod"
            className={`${field} numerals`}
          />
        </label>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Giriş yapılıyor...' : needsTotp ? 'Kodu Doğrula' : 'Giriş Yap'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

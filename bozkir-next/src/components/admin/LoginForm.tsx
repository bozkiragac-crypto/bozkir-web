'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/app/admin/actions';
import { ADMIN_SEEN_KEY, ADMIN_TAB_KEY } from '@/lib/admin/session-keys';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
      setError(res.error ?? 'GiriÅŸ yapÄ±lamadÄ±.');
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_TAB_KEY, '1');
      localStorage.setItem(ADMIN_SEEN_KEY, String(Date.now()));
    } catch {
      // Depolama eriÅŸilemezse geÃ§ (gizli sekme vb.).
    }
    router.replace('/admin');
    router.refresh();
  }

  const field =
    'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="mb-2 flex justify-center">
        <BrandLogo className="h-12" />
      </div>
      <label className="grid gap-2">
        <span className="text-xs tracking-[0.14em] text-muted uppercase">KullanÄ±cÄ± adÄ±</span>
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
        <span className="text-xs tracking-[0.14em] text-muted uppercase">Åifre</span>
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
          <span className="text-xs tracking-[0.14em] text-muted uppercase">
            DoÄŸrulama kodu (2FA)
          </span>
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
        {loading ? 'GiriÅŸ yapÄ±lÄ±yor...' : needsTotp ? 'Kodu DoÄŸrula' : 'GiriÅŸ Yap'}
      </button>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

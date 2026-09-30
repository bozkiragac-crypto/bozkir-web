'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldOff, Copy } from 'lucide-react';
import { startTotpSetup, enableTotp, disableTotp } from '@/app/admin/actions';

/** Yönetici hesabı için iki adımlı doğrulama (TOTP) yönetimi. */
export function TotpSettings({ enabled }: { enabled: boolean }) {
  const [isOn, setIsOn] = useState(enabled);
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function begin() {
    setBusy(true);
    setMsg(null);
    const res = await startTotpSetup();
    setBusy(false);
    if (res.ok && res.secret && res.uri) {
      setSecret(res.secret);
      setUri(res.uri);
    } else {
      setMsg({ ok: false, text: res.error ?? 'Kurulum başlatılamadı.' });
    }
  }

  async function confirmEnable() {
    setBusy(true);
    setMsg(null);
    const res = await enableTotp(secret, code);
    setBusy(false);
    if (res.ok) {
      setIsOn(true);
      setSecret('');
      setUri('');
      setCode('');
      setMsg({ ok: true, text: '2FA etkinleştirildi.' });
    } else {
      setMsg({ ok: false, text: res.error ?? 'Doğrulanamadı.' });
    }
  }

  async function turnOff() {
    setBusy(true);
    setMsg(null);
    const res = await disableTotp(code);
    setBusy(false);
    if (res.ok) {
      setIsOn(false);
      setCode('');
      setMsg({ ok: true, text: '2FA kapatıldı.' });
    } else {
      setMsg({ ok: false, text: res.error ?? 'Doğrulanamadı.' });
    }
  }

  const field =
    'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-foreground';

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        {isOn ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <ShieldOff className="h-5 w-5 text-muted-strong" />}
        <p className="font-medium">İki Adımlı Doğrulama (2FA)</p>
        <span className={isOn ? 'ml-auto rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-800' : 'ml-auto rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-strong'}>
          {isOn ? 'Etkin' : 'Kapalı'}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-strong">
        Authenticator uygulamasıyla (Google Authenticator, Authy) girişte 6 haneli kod istenir.
      </p>

      {!isOn && !secret && (
        <button
          type="button"
          onClick={begin}
          disabled={busy}
          className="mt-4 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
        >
          Kurulumu Başlat
        </button>
      )}

      {!isOn && secret && (
        <div className="mt-4 grid gap-3">
          <p className="text-xs text-muted-strong">Authenticator uygulamasına aşağıdaki anahtarı ekleyin:</p>
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-xs">{secret}</code>
            <button type="button" onClick={() => navigator.clipboard?.writeText(secret)} aria-label="Kopyala" className="text-muted-strong hover:text-foreground">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer">otpauth bağlantısını göster</summary>
            <code className="mt-1 block break-all">{uri}</code>
          </details>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="6 haneli kod"
            className={`${field} numerals`}
          />
          <button
            type="button"
            onClick={confirmEnable}
            disabled={busy}
            className="inline-flex h-11 w-fit items-center rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
          >
            Doğrula ve Etkinleştir
          </button>
        </div>
      )}

      {isOn && (
        <div className="mt-4 grid gap-3">
          <p className="text-xs text-muted-strong">Kapatmak için mevcut 6 haneli kodu girin:</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="6 haneli kod" className={`${field} numerals`} />
          <button
            type="button"
            onClick={turnOff}
            disabled={busy}
            className="inline-flex h-11 w-fit items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
          >
            Kapat
          </button>
        </div>
      )}

      {msg && <p className={msg.ok ? 'mt-3 text-sm text-green-700' : 'mt-3 text-sm text-red-600'}>{msg.text}</p>}
    </div>
  );
}

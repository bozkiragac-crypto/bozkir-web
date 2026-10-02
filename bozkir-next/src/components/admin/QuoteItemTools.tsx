'use client';

/**
 * Teklif durumu + dahili not + WhatsApp hızlı yanıt.
 *
 * Durum ve not ayrı ayrı kaydedilir; ikisi de `safe-actions` üzerinden
 * çağrıldığı için yetki/DB hatası butonu kilitlemez, mesaj olarak döner.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, MessageCircle, Loader2 } from 'lucide-react';
import { updateQuoteStatus, updateQuoteNote } from '@/lib/admin/safe-actions';
import {
  QUOTE_STATUSES,
  QUOTE_STATUS_CLASS,
  QUOTE_STATUS_LABEL,
  type QuoteStatus,
} from '@/lib/quotes/status';

const STATUS_ORDER: QuoteStatus[] = [...QUOTE_STATUSES];

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const cls = QUOTE_STATUS_CLASS[status] ?? QUOTE_STATUS_CLASS.new;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>
      {QUOTE_STATUS_LABEL[status] ?? QUOTE_STATUS_LABEL.new}
    </span>
  );
}

export function QuoteItemTools({
  id,
  status,
  internalNote,
  phone,
  fullName,
}: {
  id: string;
  status: QuoteStatus;
  internalNote: string | null;
  phone: string;
  fullName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState(internalNote ?? '');
  const [savedNote, setSavedNote] = useState(internalNote ?? '');
  const [current, setCurrent] = useState<QuoteStatus>(status);

  async function changeStatus(next: QuoteStatus) {
    const prev = current;
    setCurrent(next);
    setBusy(true);
    setError('');
    const res = await updateQuoteStatus(id, next);
    setBusy(false);
    if (!res.ok) {
      setCurrent(prev);
      setError(res.error ?? 'Durum güncellenemedi.');
      return;
    }
    router.refresh();
  }

  async function saveNote() {
    setNoteBusy(true);
    setError('');
    const res = await updateQuoteNote(id, note);
    setNoteBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Not kaydedilemedi.');
      return;
    }
    setSavedNote(note);
    router.refresh();
  }

  const noteDirty = note.trim() !== savedNote.trim();

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-muted-strong">
          Durum
          <select
            value={current}
            disabled={busy}
            onChange={(e) => changeStatus(e.target.value as QuoteStatus)}
            className="numerals rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg disabled:opacity-50"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {QUOTE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <QuoteStatusBadge status={current} />
        <a
          href={waLink(phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 px-3 py-1.5 text-xs text-emerald-700 transition-colors hover:bg-emerald-50"
          title={`${fullName} ile WhatsApp'ta yazış`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
      </div>

      <div className="mt-4">
        <label className="text-xs tracking-[0.14em] text-muted uppercase" htmlFor={`note-${id}`}>
          Dahili not (müşteriye gösterilmez)
        </label>
        <textarea
          id={`note-${id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Görüşme özeti, verilen fiyat, takip tarihi…"
          className="mt-2 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={noteBusy || !noteDirty}
            onClick={saveNote}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-fg transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> Notu kaydet
          </button>
          {noteBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}

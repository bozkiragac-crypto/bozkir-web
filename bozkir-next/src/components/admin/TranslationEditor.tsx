'use client';

import { useState } from 'react';
import { Save, Languages } from 'lucide-react';
import { saveTranslations, type TranslationKind, type TranslationUpdate } from '@/lib/admin/safe-actions';

export interface TranslationRow {
  id: string;
  /** TR görünen metin (örn. ürün adı). */
  tr: string;
  /** İkincil TR metin (örn. kategori). */
  trAlt?: string;
  en: string;
  ar: string;
  en2?: string;
  ar2?: string;
}

export interface TranslationGroup {
  kind: TranslationKind;
  title: string;
  /** Birincil alan adı (EN). */
  field1: string;
  /** İkincil alan adı (EN) — varsa. */
  field2?: string;
  rows: TranslationRow[];
}

const field =
  'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-foreground';

function Row({
  group,
  row,
  onSaved,
}: {
  group: TranslationGroup;
  row: TranslationRow;
  onSaved: (id: string, fields: Record<string, string>) => void;
}) {
  const [en, setEn] = useState(row.en);
  const [ar, setAr] = useState(row.ar);
  const [en2, setEn2] = useState(row.en2 ?? '');
  const [ar2, setAr2] = useState(row.ar2 ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Alan adları: field1 = örn. nameEn; field2 = örn. catEn (varsa)
  const arField1 = group.field1.replace(/En$/, 'Ar');
  const arField2 = group.field2?.replace(/En$/, 'Ar');

  async function save() {
    setBusy(true);
    setMsg(null);
    const fields: Record<string, string> = { [group.field1]: en, [arField1]: ar };
    if (group.field2) fields[group.field2] = en2;
    if (arField2) fields[arField2] = ar2;
    const update: TranslationUpdate = { kind: group.kind, id: row.id, fields };
    const res = await saveTranslations([update]);
    setBusy(false);
    if (res.ok) {
      setMsg('Kaydedildi');
      onSaved(row.id, fields);
    } else {
      setMsg(res.error ?? 'Hata');
    }
  }

  return (
    <div className="grid gap-2 rounded-lg border border-border p-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.tr}</p>
        {row.trAlt && <p className="truncate text-xs text-muted">{row.trAlt}</p>}
      </div>
      <div className="grid gap-2">
        <input className={field} value={en} onChange={(e) => setEn(e.target.value)} placeholder={group.field1} />
        {group.field2 && <input className={field} value={en2} onChange={(e) => setEn2(e.target.value)} placeholder={group.field2} />}
      </div>
      <div className="grid gap-2">
        <input className={field} dir="rtl" value={ar} onChange={(e) => setAr(e.target.value)} placeholder={arField1} />
        {arField2 && <input className={field} dir="rtl" value={ar2} onChange={(e) => setAr2(e.target.value)} placeholder={arField2} />}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" /> {busy ? '...' : 'Kaydet'}
        </button>
        {msg && <span className="text-xs text-muted-strong">{msg}</span>}
      </div>
    </div>
  );
}

export function TranslationEditor({ groups }: { groups: TranslationGroup[] }) {
  const [state, setState] = useState(groups);
  const total = state.reduce((n, g) => n + g.rows.length, 0);

  function markSaved(kind: TranslationKind, id: string, fields: Record<string, string>) {
    setState((prev) =>
      prev.map((g) =>
        g.kind !== kind
          ? g
          : { ...g, rows: g.rows.map((r) => (r.id === id ? { ...r, ...mapFieldsToRow(fields, g) } : r)) },
      ),
    );
  }

  function mapFieldsToRow(fields: Record<string, string>, g: TranslationGroup): Partial<TranslationRow> {
    const ar1 = g.field1.replace(/En$/, 'Ar');
    const out: Partial<TranslationRow> = { en: fields[g.field1] ?? '', ar: fields[ar1] ?? '' };
    if (g.field2) out.en2 = fields[g.field2] ?? '';
    if (g.field2) out.ar2 = fields[g.field2.replace(/En$/, 'Ar')] ?? '';
    return out;
  }

  if (total === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-strong">
        Eksik çeviri yok — tüm kayıtların EN/AR alanları dolu.
      </p>
    );
  }

  return (
    <div className="grid gap-10">
      {state
        .filter((g) => g.rows.length > 0)
        .map((g) => (
          <section key={g.kind}>
            <div className="flex items-center gap-3">
              <Languages className="h-4 w-4 text-muted-strong" />
              <h2 className="text-lg font-medium tracking-tight">{g.title}</h2>
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted-strong">{g.rows.length} eksik</span>
            </div>
            <div className="mt-4 grid gap-3">
              {g.rows.map((row) => (
                <Row key={row.id} group={g} row={row} onSaved={(id, fields) => markSaved(g.kind, id, fields)} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

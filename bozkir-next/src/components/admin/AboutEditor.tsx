'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';
import { saveAboutContent, type AboutInput } from '@/lib/admin/safe-actions';

type Stat = { value: string; label: string; labelEn: string; labelAr: string };
type Value = { title: string; text: string; titleEn: string; titleAr: string; textEn: string; textAr: string };
type Milestone = { year: string; title: string; text: string; titleEn: string; titleAr: string; textEn: string; textAr: string };

const field =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-foreground';

function Section({
  title,
  hint,
  onAdd,
  children,
}: {
  title: string;
  hint: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2"
        >
          <Plus className="h-3.5 w-3.5" /> Ekle
        </button>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

export function AboutEditor({
  initialStats,
  initialValues,
  initialTimeline,
}: {
  initialStats: Stat[];
  initialValues: Value[];
  initialTimeline: Milestone[];
}) {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const [values, setValues] = useState<Value[]>(initialValues);
  const [timeline, setTimeline] = useState<Milestone[]>(initialTimeline);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const payload: AboutInput = {
      stats: stats.map((s) => ({ value: s.value, label: s.label, labelEn: s.labelEn, labelAr: s.labelAr })),
      values: values.map((v) => ({
        title: v.title,
        text: v.text,
        titleEn: v.titleEn,
        titleAr: v.titleAr,
        textEn: v.textEn,
        textAr: v.textAr,
      })),
      timeline: timeline.map((m) => ({
        year: m.year,
        title: m.title,
        text: m.text,
        titleEn: m.titleEn,
        titleAr: m.titleAr,
        textEn: m.textEn,
        textAr: m.textAr,
      })),
    };
    const res = await saveAboutContent(payload);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: 'Kaydedildi.' } : { ok: false, text: res.error ?? 'Kaydedilemedi.' });
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid gap-6">
      <Section
        title="İstatistikler"
        hint="Örn. 1979 · Sektör tecrübesinin başlangıcı"
        onAdd={() => setStats((s) => [...s, { value: '', label: '', labelEn: '', labelAr: '' }])}
      >
        {stats.map((s, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[90px_1fr_1fr_1fr_auto]">
            <input className={field} value={s.value} onChange={(e) => setStats((a) => a.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Değer" />
            <input className={field} value={s.label} onChange={(e) => setStats((a) => a.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Etiket (TR)" />
            <input className={field} value={s.labelEn} onChange={(e) => setStats((a) => a.map((x, j) => (j === i ? { ...x, labelEn: e.target.value } : x)))} placeholder="Label (EN)" />
            <input className={field} dir="rtl" value={s.labelAr} onChange={(e) => setStats((a) => a.map((x, j) => (j === i ? { ...x, labelAr: e.target.value } : x)))} placeholder="التسمية (AR)" />
            <button type="button" onClick={() => setStats((a) => a.filter((_, j) => j !== i))} aria-label="Sil" className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted-strong hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Section>

      <Section
        title="Değerler"
        hint="Hakkımızda sayfasındaki 3 kart (başlık + metin)"
        onAdd={() => setValues((s) => [...s, { title: '', text: '', titleEn: '', titleAr: '', textEn: '', textAr: '' }])}
      >
        {values.map((v, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <input className={field} value={v.title} onChange={(e) => setValues((a) => a.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Başlık (TR)" />
              <input className={field} value={v.titleEn} onChange={(e) => setValues((a) => a.map((x, j) => (j === i ? { ...x, titleEn: e.target.value } : x)))} placeholder="Title (EN)" />
              <input className={field} dir="rtl" value={v.titleAr} onChange={(e) => setValues((a) => a.map((x, j) => (j === i ? { ...x, titleAr: e.target.value } : x)))} placeholder="العنوان (AR)" />
            </div>
            <textarea className={area} rows={2} value={v.text} onChange={(e) => setValues((a) => a.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="Metin (TR)" />
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea className={area} rows={2} value={v.textEn} onChange={(e) => setValues((a) => a.map((x, j) => (j === i ? { ...x, textEn: e.target.value } : x)))} placeholder="Text (EN)" />
              <textarea className={area} rows={2} dir="rtl" value={v.textAr} onChange={(e) => setValues((a) => a.map((x, j) => (j === i ? { ...x, textAr: e.target.value } : x)))} placeholder="النص (AR)" />
            </div>
            <button type="button" onClick={() => setValues((a) => a.filter((_, j) => j !== i))} className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-strong hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Sil
            </button>
          </div>
        ))}
      </Section>

      <Section
        title="Zaman Çizelgesi"
        hint="Örn. 2016 · Kurumsallaşma · açıklama"
        onAdd={() => setTimeline((s) => [...s, { year: '', title: '', text: '', titleEn: '', titleAr: '', textEn: '', textAr: '' }])}
      >
        {timeline.map((m, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border p-4">
            <div className="grid gap-2 sm:grid-cols-[100px_1fr_1fr_1fr_auto]">
              <input className={field} value={m.year} onChange={(e) => setTimeline((a) => a.map((x, j) => (j === i ? { ...x, year: e.target.value } : x)))} placeholder="Yıl" />
              <input className={field} value={m.title} onChange={(e) => setTimeline((a) => a.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Başlık (TR)" />
              <input className={field} value={m.titleEn} onChange={(e) => setTimeline((a) => a.map((x, j) => (j === i ? { ...x, titleEn: e.target.value } : x)))} placeholder="Title (EN)" />
              <input className={field} dir="rtl" value={m.titleAr} onChange={(e) => setTimeline((a) => a.map((x, j) => (j === i ? { ...x, titleAr: e.target.value } : x)))} placeholder="العنوان (AR)" />
              <button type="button" onClick={() => setTimeline((a) => a.filter((_, j) => j !== i))} aria-label="Sil" className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted-strong hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea className={area} rows={2} value={m.text} onChange={(e) => setTimeline((a) => a.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="Metin (TR)" />
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea className={area} rows={2} value={m.textEn} onChange={(e) => setTimeline((a) => a.map((x, j) => (j === i ? { ...x, textEn: e.target.value } : x)))} placeholder="Text (EN)" />
              <textarea className={area} rows={2} dir="rtl" value={m.textAr} onChange={(e) => setTimeline((a) => a.map((x, j) => (j === i ? { ...x, textAr: e.target.value } : x)))} placeholder="النص (AR)" />
            </div>
          </div>
        ))}
      </Section>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {msg && <p className={msg.ok ? 'text-sm text-green-700' : 'text-sm text-red-600'}>{msg.text}</p>}
      </div>
    </div>
  );
}

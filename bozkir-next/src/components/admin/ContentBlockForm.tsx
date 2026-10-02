'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveContentBlock } from '@/lib/admin/safe-actions';
import { ContentItemsEditor, type EditableItem } from './ContentItemsEditor';

interface ContentBlockFormProps {
  blockKey: string;
  initial: {
    title: string;
    subtitle: string;
    body: string;
    isActive: boolean;
    titleEn: string;
    titleAr: string;
    subtitleEn: string;
    subtitleAr: string;
    bodyEn: string;
    bodyAr: string;
  };
  items: EditableItem[];
}

const field =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground';

export function ContentBlockForm({ blockKey, initial, items }: ContentBlockFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [body, setBody] = useState(initial.body);
  const [titleEn, setTitleEn] = useState(initial.titleEn);
  const [titleAr, setTitleAr] = useState(initial.titleAr);
  const [subtitleEn, setSubtitleEn] = useState(initial.subtitleEn);
  const [subtitleAr, setSubtitleAr] = useState(initial.subtitleAr);
  const [bodyEn, setBodyEn] = useState(initial.bodyEn);
  const [bodyAr, setBodyAr] = useState(initial.bodyAr);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await saveContentBlock({
      key: blockKey,
      title,
      subtitle,
      body,
      isActive,
      titleEn,
      titleAr,
      subtitleEn,
      subtitleAr,
      bodyEn,
      bodyAr,
    });
    setBusy(false);
    setMsg(res.ok ? 'Kaydedildi' : res.error ?? 'Hata');
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid gap-10">
      <div className="rounded-xl border border-border bg-surface p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Başlık</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Alt başlık / üst etiket</span>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={field} />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className={area}
            />
          </label>
        </div>

        <fieldset className="mt-5 grid gap-5 rounded-md border border-border p-5 sm:grid-cols-2">
          <legend className="px-2 text-xs tracking-[0.14em] text-muted uppercase">
            Çeviriler (boşsa Türkçe kullanılır)
          </legend>
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Başlık (EN)</span>
            <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={field} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Başlık (AR)</span>
            <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className={field} dir="rtl" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Üst etiket (EN)</span>
            <input value={subtitleEn} onChange={(e) => setSubtitleEn(e.target.value)} className={field} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Üst etiket (AR)</span>
            <input value={subtitleAr} onChange={(e) => setSubtitleAr(e.target.value)} className={field} dir="rtl" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama (EN)</span>
            <textarea value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} rows={3} className={area} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama (AR)</span>
            <textarea value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} rows={3} className={area} dir="rtl" />
          </label>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Aktif (anasayfada göster)
          </label>
        </div>

        <div className="mt-6 flex items-center gap-4 border-t border-border pt-6">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Kaydediliyor...' : 'Blok Ayarlarını Kaydet'}
          </button>
          {msg && <span className="text-sm text-muted-strong">{msg}</span>}
        </div>
      </div>

      <ContentItemsEditor blockKey={blockKey} items={items} />
    </div>
  );
}

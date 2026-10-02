'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCampaign } from '@/lib/admin/safe-actions';
import { ImageManager } from './ImageManager';

interface CampaignFormProps {
  initial?: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    linkLabel: string;
    sortOrder: number;
    isActive: boolean;
    startsAt: string;
    endsAt: string;
    titleEn?: string | null;
    titleAr?: string | null;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
    linkLabelEn?: string | null;
    linkLabelAr?: string | null;
  };
}

const field =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground';

/** ISO -> datetime-local (YYYY-MM-DDTHH:mm) */
function toLocalInput(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CampaignForm({ initial }: CampaignFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? '');
  const [linkLabel, setLinkLabel] = useState(initial?.linkLabel ?? 'İncele');
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? '');
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? '');
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? '');
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? '');
  const [linkLabelEn, setLinkLabelEn] = useState(initial?.linkLabelEn ?? '');
  const [linkLabelAr, setLinkLabelAr] = useState(initial?.linkLabelAr ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt ?? ''));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveCampaign({
      id: initial?.id,
      title,
      description,
      imageUrl,
      linkUrl,
      linkLabel,
      sortOrder: parseInt(sortOrder, 10) || 0,
      isActive,
      startsAt,
      endsAt,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      linkLabelEn,
      linkLabelAr,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Kaydedilemedi.');
      return;
    }
    router.push('/admin/kampanyalar');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Başlık *</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama / Metin</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Bağlantı (URL)</span>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={field} placeholder="/urunler veya https://..." />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Buton Yazısı</span>
          <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Sıra</span>
          <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Durum</span>
          <span className="flex h-12 items-center gap-3 rounded-md border border-border bg-surface px-4">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm">Aktif (sitede göster)</span>
          </span>
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Başlangıç (opsiyonel)</span>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Bitiş (opsiyonel)</span>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={field} />
        </label>
      </div>

      <fieldset className="grid gap-5 rounded-md border border-border p-5 sm:grid-cols-2">
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
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama (EN)</span>
          <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={3} className={area} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama (AR)</span>
          <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={3} className={area} dir="rtl" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Buton Yazısı (EN)</span>
          <input value={linkLabelEn} onChange={(e) => setLinkLabelEn(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Buton Yazısı (AR)</span>
          <input value={linkLabelAr} onChange={(e) => setLinkLabelAr(e.target.value)} className={field} dir="rtl" />
        </label>
      </fieldset>

      <ImageManager
        images={imageUrl ? [imageUrl] : []}
        onChange={(next) => setImageUrl(next[0] ?? '')}
        folder="campaigns"
        multiple={false}
        label="Kampanya Görseli"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4 border-t border-border pt-6">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button type="button" onClick={() => router.push('/admin/kampanyalar')} className="text-sm text-muted-strong hover:text-foreground">
          İptal
        </button>
      </div>
    </form>
  );
}

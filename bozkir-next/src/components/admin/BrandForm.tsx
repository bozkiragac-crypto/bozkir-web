'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveBrand } from '@/lib/admin/safe-actions';
import { ImageManager } from './ImageManager';

interface BrandFormProps {
  initial?: {
    id: string;
    name: string;
    logo: string;
    url: string;
    category: string;
    categoryEn?: string | null;
    categoryAr?: string | null;
    description?: string | null;
    sortOrder: number;
    isActive: boolean;
  };
}

const field =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground';

export function BrandForm({ initial }: BrandFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [logo, setLogo] = useState(initial?.logo ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [categoryEn, setCategoryEn] = useState(initial?.categoryEn ?? '');
  const [categoryAr, setCategoryAr] = useState(initial?.categoryAr ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveBrand({
      id: initial?.id,
      name,
      logo,
      url,
      category,
      categoryEn,
      categoryAr,
      description,
      sortOrder: parseInt(sortOrder, 10) || 0,
      isActive,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Kaydedilemedi.');
      return;
    }
    router.push('/admin/bayilikler');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Marka adı *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kategori (TR)</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className={field} placeholder="Örn: MDF / Panel" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kategori (EN)</span>
          <input value={categoryEn} onChange={(e) => setCategoryEn(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kategori (AR)</span>
          <input value={categoryAr} onChange={(e) => setCategoryAr(e.target.value)} className={field} dir="rtl" />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Web sitesi (URL)</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className={field} placeholder="https://..." />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={area} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Sıra</span>
          <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Durum</span>
          <span className="flex h-12 items-center gap-3 rounded-md border border-border bg-surface px-4">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm">Aktif</span>
          </span>
        </label>
      </div>

      <ImageManager
        images={logo ? [logo] : []}
        onChange={(next) => setLogo(next[0] ?? '')}
        folder="content"
        multiple={false}
        label="Marka logosu"
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
        <button type="button" onClick={() => router.push('/admin/bayilikler')} className="text-sm text-muted-strong hover:text-foreground">
          İptal
        </button>
      </div>
    </form>
  );
}

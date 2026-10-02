'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCatalog } from '@/lib/admin/safe-actions';
import { ImageManager } from './ImageManager';
import { PdfUpload } from './PdfUpload';

interface CatalogFormProps {
  initial?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    year: number;
    cover: string;
    pdfUrl: string;
    pageCount: number;
    sortOrder: number;
    isActive: boolean;
    titleEn?: string | null;
    titleAr?: string | null;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
  };
}

const field =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground';

export function CatalogForm({ initial }: CatalogFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [year, setYear] = useState(String(initial?.year ?? new Date().getFullYear()));
  const [cover, setCover] = useState(initial?.cover ?? '');
  const [pdfUrl, setPdfUrl] = useState(initial?.pdfUrl ?? '');
  const [pageCount, setPageCount] = useState(initial?.pageCount ? String(initial.pageCount) : '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? '');
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? '');
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? '');
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveCatalog({
      id: initial?.id,
      slug,
      title,
      description,
      year: parseInt(year, 10) || 0,
      cover,
      pdfUrl,
      pageCount: parseInt(pageCount, 10) || 0,
      sortOrder: parseInt(sortOrder, 10) || 0,
      isActive,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Kaydedilemedi.');
      return;
    }
    router.push('/admin/kataloglar');
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
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={area} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Yıl</span>
          <input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Sayfa sayısı</span>
          <input value={pageCount} onChange={(e) => setPageCount(e.target.value)} inputMode="numeric" className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Slug (boşsa başlıktan üretilir)</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={field} />
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
      </fieldset>

      <ImageManager
        images={cover ? [cover] : []}
        onChange={(next) => setCover(next[0] ?? '')}
        folder="catalogs"
        multiple={false}
        label="Katalog Kapağı"
      />

      <PdfUpload value={pdfUrl} onChange={setPdfUrl} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4 border-t border-border pt-6">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button type="button" onClick={() => router.push('/admin/kataloglar')} className="text-sm text-muted-strong hover:text-foreground">
          İptal
        </button>
      </div>
    </form>
  );
}

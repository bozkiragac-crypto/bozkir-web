'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCategory } from '@/lib/admin/safe-actions';
import { ImageManager } from './ImageManager';

interface CategoryFormProps {
  initial?: {
    id: string;
    slug: string;
    name: string;
    nameEn?: string | null;
    nameAr?: string | null;
    description: string;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
    shortDescription?: string | null;
    shortDescriptionEn?: string | null;
    shortDescriptionAr?: string | null;
    thumbnail: string;
    heroImage: string;
    featured: boolean;
    sortOrder: number;
    isActive: boolean;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
}

const field =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground';

export function CategoryForm({ initial }: CategoryFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? '');
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [shortDescriptionEn, setShortDescriptionEn] = useState(initial?.shortDescriptionEn ?? '');
  const [shortDescriptionAr, setShortDescriptionAr] = useState(initial?.shortDescriptionAr ?? '');
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail ?? '');
  const [heroImage, setHeroImage] = useState(initial?.heroImage ?? '');
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveCategory({
      id: initial?.id,
      slug,
      name,
      nameEn,
      nameAr,
      description,
      descriptionEn,
      descriptionAr,
      shortDescription,
      shortDescriptionEn,
      shortDescriptionAr,
      thumbnail,
      heroImage,
      featured,
      sortOrder: parseInt(sortOrder, 10) || 0,
      isActive,
      seoTitle,
      seoDescription,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Kaydedilemedi.');
      return;
    }
    router.push('/admin/kategoriler');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Ad *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Slug (boşsa addan üretilir)</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={area} />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kısa açıklama</span>
          <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className={field} />
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
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Vitrinde göster (öne çıkan)
        </label>
      </div>

      <fieldset className="grid gap-5 rounded-md border border-border p-5 sm:grid-cols-2">
        <legend className="px-2 text-xs tracking-[0.14em] text-muted uppercase">
          Çeviriler (boşsa Türkçe kullanılır)
        </legend>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Ad (EN)</span>
          <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Ad (AR)</span>
          <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={field} dir="rtl" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama (EN)</span>
          <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={2} className={area} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Açıklama (AR)</span>
          <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={2} className={area} dir="rtl" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kısa açıklama (EN)</span>
          <input value={shortDescriptionEn} onChange={(e) => setShortDescriptionEn(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kısa açıklama (AR)</span>
          <input value={shortDescriptionAr} onChange={(e) => setShortDescriptionAr(e.target.value)} className={field} dir="rtl" />
        </label>
      </fieldset>

      <fieldset className="grid gap-5 rounded-md border border-border p-5">
        <legend className="px-2 text-xs tracking-[0.14em] text-muted uppercase">SEO</legend>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">SEO başlık</span>
          <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">SEO açıklama</span>
          <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} className={area} />
        </label>
      </fieldset>

      <div className="grid gap-6 md:grid-cols-2">
        <ImageManager
          images={thumbnail ? [thumbnail] : []}
          onChange={(next) => setThumbnail(next[0] ?? '')}
          folder="content"
          multiple={false}
          label="Küçük görsel"
        />
        <ImageManager
          images={heroImage ? [heroImage] : []}
          onChange={(next) => setHeroImage(next[0] ?? '')}
          folder="content"
          multiple={false}
          label="Vitrin görseli"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4 border-t border-border pt-6">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button type="button" onClick={() => router.push('/admin/kategoriler')} className="text-sm text-muted-strong hover:text-foreground">
          İptal
        </button>
      </div>
    </form>
  );
}

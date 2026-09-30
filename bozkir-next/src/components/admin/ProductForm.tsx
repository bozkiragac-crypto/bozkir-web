'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProduct } from '@/app/admin/actions';
import { ImageManager } from './ImageManager';

interface ProductFormProps {
  categories: { slug: string; name: string }[];
  initial?: {
    id: string;
    name: string;
    code: string;
    cat: string;
    face: string;
    images: string[];
    nameEn?: string | null;
    nameAr?: string | null;
    catEn?: string | null;
    catAr?: string | null;
  };
}

const field =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';

export function ProductForm({ categories, initial }: ProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [cat, setCat] = useState(initial?.cat ?? '');
  const [face, setFace] = useState(initial?.face ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? '');
  const [catEn, setCatEn] = useState(initial?.catEn ?? '');
  const [catAr, setCatAr] = useState(initial?.catAr ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveProduct({
      id: initial?.id,
      name,
      code,
      cat,
      face,
      images,
      nameEn,
      nameAr,
      catEn,
      catAr,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Kaydedilemedi.');
      return;
    }
    router.push('/admin/urunler');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Ürün Adı *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Ürün Kodu *</span>
          <input required value={code} onChange={(e) => setCode(e.target.value)} className={field} placeholder="Örn: VT-828" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kategori *</span>
          <input
            required
            list="admin-cat-list"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className={field}
            placeholder="Örn: MDF LAM"
          />
          <datalist id="admin-cat-list">
            {categories.map((c) => (
              <option key={c.slug} value={c.name} />
            ))}
          </datalist>
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Yüzey</span>
          <input value={face} onChange={(e) => setFace(e.target.value)} className={field} placeholder="1 / 2 / 3" />
        </label>
      </div>

      <fieldset className="grid gap-5 rounded-md border border-border p-5 sm:grid-cols-2">
        <legend className="px-2 text-xs tracking-[0.14em] text-muted uppercase">
          Çeviriler (boşsa Türkçe kullanılır)
        </legend>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Ürün Adı (EN)</span>
          <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={field} placeholder="e.g. MDF Lam" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Ürün Adı (AR)</span>
          <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={field} dir="rtl" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kategori (EN)</span>
          <input value={catEn} onChange={(e) => setCatEn(e.target.value)} className={field} placeholder="e.g. MDF Lam" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs tracking-[0.14em] text-muted uppercase">Kategori (AR)</span>
          <input value={catAr} onChange={(e) => setCatAr(e.target.value)} className={field} dir="rtl" />
        </label>
      </fieldset>

      <ImageManager
        images={images}
        onChange={setImages}
        folder="products"
        ownerId={initial?.id}
        label="Ürün Görselleri"
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
        <button
          type="button"
          onClick={() => router.push('/admin/urunler')}
          className="text-sm text-muted-strong hover:text-foreground"
        >
          İptal
        </button>
      </div>
    </form>
  );
}

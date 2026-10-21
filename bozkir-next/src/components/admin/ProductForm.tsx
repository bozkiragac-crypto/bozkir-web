'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { saveProduct } from '@/lib/admin/safe-actions';
import { useToast } from '@/components/ui/ToastProvider';
import { ImageManager } from './ImageManager';

interface ProductFormProps {
  categories: { slug: string; name: string }[];
  initial?: {
    id: string;
    name: string;
    code: string;
    cat: string;
    face: string;
    colors?: string | null;
    thicknesses?: string | null;
    images: string[];
    nameEn?: string | null;
    nameAr?: string | null;
    catEn?: string | null;
    catAr?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    whatsappMessage?: string | null;
    whatsappMessageEn?: string | null;
    whatsappMessageAr?: string | null;
  };
}

const field =
  'h-12 w-full rounded-md border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors focus:border-foreground';
const label = 'text-xs tracking-[0.14em] text-muted uppercase';

export function ProductForm({ categories, initial }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [cat, setCat] = useState(initial?.cat ?? '');
  const [face, setFace] = useState(initial?.face ?? '');
  const [colors, setColors] = useState(initial?.colors ?? '');
  const [thicknesses, setThicknesses] = useState(initial?.thicknesses ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? '');
  const [catEn, setCatEn] = useState(initial?.catEn ?? '');
  const [catAr, setCatAr] = useState(initial?.catAr ?? '');
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? '');
  const [whatsappMessage, setWhatsappMessage] = useState(initial?.whatsappMessage ?? '');
  const [whatsappMessageEn, setWhatsappMessageEn] = useState(initial?.whatsappMessageEn ?? '');
  const [whatsappMessageAr, setWhatsappMessageAr] = useState(initial?.whatsappMessageAr ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTarget, setSaveTarget] = useState<'list' | 'new'>('list');

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
      colors,
      thicknesses,
      images,
      nameEn,
      nameAr,
      catEn,
      catAr,
      seoTitle,
      seoDescription,
      whatsappMessage,
      whatsappMessageEn,
      whatsappMessageAr,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Kaydedilemedi.');
      return;
    }
    toast(initial?.id ? 'Ürün güncellendi.' : 'Ürün oluşturuldu.');

    // Yeni ürün akışında "kaydet ve yeni ekle": formu temizle, sayfada kal.
    if (!initial?.id && saveTarget === 'new') {
      setName('');
      setCode('');
      setFace('');
      setColors('');
      setThicknesses('');
      setWhatsappMessage('');
      setWhatsappMessageEn('');
      setWhatsappMessageAr('');
      setImages([]);
      setError(null);
      router.refresh();
      return;
    }
    router.push('/admin/urunler');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={label}>Ürün Adı *</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
        </label>
        <label className="grid gap-2">
          <span className={label}>Ürün Kodu *</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={field}
            placeholder="Örn: VT-828"
          />
        </label>
        <label className="grid gap-2">
          <span className={label}>Kategori *</span>
          <input
            required
            list="admin-cat-list"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className={field}
            placeholder="Listeden seçin veya yazın"
          />
          <datalist id="admin-cat-list">
            {categories.map((c) => (
              <option key={c.slug} value={c.name} />
            ))}
          </datalist>
        </label>
        <label className="grid gap-2">
          <span className={label}>Yüzey</span>
          <input
            value={face}
            onChange={(e) => setFace(e.target.value)}
            className={field}
            placeholder="1 / 2 / 3"
          />
        </label>
        <label className="grid gap-2">
          <span className={label}>Renkler (virgülle)</span>
          <input
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            className={field}
            placeholder="Meşe, Ceviz, Beyaz"
          />
        </label>
        <label className="grid gap-2">
          <span className={label}>Kalınlıklar (virgülle)</span>
          <input
            value={thicknesses}
            onChange={(e) => setThicknesses(e.target.value)}
            className={field}
            placeholder="8, 10, 18"
          />
        </label>
      </div>

      <ImageManager
        images={images}
        onChange={setImages}
        folder="products"
        ownerId={initial?.id}
        label="Ürün Görselleri"
      />

      <details className="group rounded-md border border-border p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
          Gelişmiş (çeviri ve SEO)
          <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-5 grid gap-6">
          <fieldset className="grid gap-5 rounded-md border border-border p-5 sm:grid-cols-2">
            <legend className={`px-2 ${label}`}>Çeviriler (boşsa Türkçe kullanılır)</legend>
            <label className="grid gap-2">
              <span className={label}>Ürün Adı (EN)</span>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className={field}
                placeholder="e.g. MDF Lam"
              />
            </label>
            <label className="grid gap-2">
              <span className={label}>Ürün Adı (AR)</span>
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className={field}
                dir="rtl"
              />
            </label>
            <label className="grid gap-2">
              <span className={label}>Kategori (EN)</span>
              <input
                value={catEn}
                onChange={(e) => setCatEn(e.target.value)}
                className={field}
                placeholder="e.g. MDF Lam"
              />
            </label>
            <label className="grid gap-2">
              <span className={label}>Kategori (AR)</span>
              <input
                value={catAr}
                onChange={(e) => setCatAr(e.target.value)}
                className={field}
                dir="rtl"
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-5 rounded-md border border-border p-5 sm:grid-cols-2">
            <legend className={`px-2 ${label}`}>SEO (boşsa otomatik üretilir)</legend>
            <label className="grid gap-2">
              <span className={label}>SEO Başlık</span>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className={field}
                placeholder="Ürün adı | Bozkır Ağaç Ürünleri"
              />
            </label>
            <label className="grid gap-2">
              <span className={label}>SEO Açıklama</span>
              <input
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className={field}
                placeholder="Arama sonuçlarında görünecek kısa açıklama"
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-5 rounded-md border border-border p-5">
            <legend className={`px-2 ${label}`}>WhatsApp mesajı (opsiyonel)</legend>
            <p className="text-xs text-muted">
              Boş bırakılırsa Ayarlar → WhatsApp mesaj şablonları kullanılır. Yer tutucular:{' '}
              <code>{'{product}'}</code>, <code>{'{code}'}</code>, <code>{'{category}'}</code>,{' '}
              <code>{'{url}'}</code>.
            </p>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={2}
              className={area}
              placeholder="Merhaba, {product} ({code}) ürünü hakkında bilgi almak istiyorum."
            />
            <textarea
              value={whatsappMessageEn}
              onChange={(e) => setWhatsappMessageEn(e.target.value)}
              rows={2}
              className={area}
              placeholder="Hello, I would like information about {product} ({code})."
            />
            <textarea
              value={whatsappMessageAr}
              onChange={(e) => setWhatsappMessageAr(e.target.value)}
              rows={2}
              className={area}
              dir="rtl"
            />
          </fieldset>
        </div>
      </details>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <button
          type="submit"
          onClick={() => setSaveTarget('list')}
          disabled={busy}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {!initial?.id && (
          <button
            type="submit"
            onClick={() => setSaveTarget('new')}
            disabled={busy}
            className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
          >
            Kaydet ve yeni ekle
          </button>
        )}
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

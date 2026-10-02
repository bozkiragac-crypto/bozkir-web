'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import { uploadMedia } from '@/lib/admin/safe-actions';
import { cn } from '@/lib/utils';
import { MAX_UPLOAD_MB } from '@/lib/media';

interface ImageManagerProps {
  images: string[];
  onChange: (next: string[]) => void;
  folder: 'products' | 'campaigns' | 'content' | 'catalogs';
  ownerId?: string;
  multiple?: boolean;
  label?: string;
}

export function ImageManager({
  images,
  onChange,
  folder,
  ownerId,
  multiple = true,
  label = 'Görseller',
}: ImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);

    const next = [...images];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadMedia(fd, folder, ownerId);
      if (res.error) {
        setError(res.error);
        continue;
      }
      if (res.url) {
        if (multiple) next.push(res.url);
        else next.splice(0, next.length, res.url);
      }
    }

    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs tracking-[0.14em] text-muted uppercase">{label}</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-dashed border-border-strong px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {busy ? 'Yükleniyor...' : 'Görsel Yükle'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      <p className="mt-2 text-xs text-muted">
        JPG, PNG, WebP veya AVIF · en fazla {MAX_UPLOAD_MB} MB. İlk görsel kapak olarak kullanılır.
      </p>

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((url, i) => (
            <li key={`${url}-${i}`} className="group relative overflow-hidden rounded-md border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-1 text-[0.6rem] font-medium text-background">
                  <Star className="h-3 w-3" /> Kapak
                </span>
              )}
              {/* Mobilde hover yok; kontroller gizli kalınca görsel
                  düzenlenemiyordu. Sitedeki ProductCard/ProductGallery
                  pattern'i: mobilde hep görünür, md üstü hover/focus ile açılır. */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1.5 opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Sola taşı"
                    className="flex h-8 w-8 items-center justify-center rounded text-white disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Sağa taşı"
                    className="flex h-8 w-8 items-center justify-center rounded text-white disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  aria-label="Görseli kaldır"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded text-white transition-colors hover:text-red-400',
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted">
          Henüz görsel yok.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

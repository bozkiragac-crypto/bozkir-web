'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Upload, Search, CheckCircle2 } from 'lucide-react';
import { deleteMediaKey, uploadMedia } from '@/lib/admin/safe-actions';

export interface MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  inUse: boolean;
}

type MediaFolder = 'products' | 'campaigns' | 'content' | 'catalogs' | 'quotes';

function kb(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

function buildUrl(folder: string, q: string, sayfa = 1): string {
  const qs = new URLSearchParams();
  if (folder && folder !== 'all') qs.set('klasor', folder);
  if (q) qs.set('q', q);
  if (sayfa > 1) qs.set('sayfa', String(sayfa));
  const s = qs.toString();
  return `/admin/medya${s ? `?${s}` : ''}`;
}

export function MediaLibrary({
  items,
  page,
  totalPages,
  total,
  folder,
  q,
  folders,
}: {
  items: MediaItem[];
  page: number;
  totalPages: number;
  total: number;
  folder: string;
  q: string;
  folders: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>(
    (folders.includes('content') ? 'content' : (folders[0] as MediaFolder)) as MediaFolder,
  );

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadMedia(fd, uploadFolder);
      if (res.error) setError(res.error);
    }
    setBusy(false);
    router.refresh();
  }

  async function onDelete(key: string, inUse: boolean) {
    if (inUse) {
      if (!confirm('Bu görsel bir içerikte kullanılıyor. Yine de silinsin mi?')) return;
    } else if (!confirm('Bu görsel silinsin mi?')) return;
    setBusy(true);
    const res = await deleteMediaKey(key);
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'Silinemedi.');
    else router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Medya kütüphanesi</h1>
          <p className="mt-1 text-sm text-muted-strong">{total} görsel · depolama: SeaweedFS</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value as MediaFolder)}
            aria-label="Yükleme klasörü"
            className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
          >
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">
            <Upload className="h-4 w-4" />
            {busy ? 'Yükleniyor...' : 'Yükle'}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => onUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form action="/admin/medya" method="get" className="flex items-center gap-3 rounded-full border border-border px-4">
          {folder !== 'all' && <input type="hidden" name="klasor" value={folder} />}
          <Search className="h-4 w-4 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Dosya ara..."
            className="h-11 w-48 bg-transparent text-sm outline-none placeholder:text-muted sm:w-64"
          />
        </form>
        <select
          value={folder}
          onChange={(e) => router.push(buildUrl(e.target.value, q))}
          aria-label="Klasör filtresi"
          className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
        >
          <option value="all">Tüm klasörler</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        {q && (
          <Link
            href={buildUrl(folder, '')}
            className="text-xs text-muted-strong transition-colors hover:text-foreground"
          >
            Aramayı temizle
          </Link>
        )}
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.key} className="group overflow-hidden rounded-lg border border-border bg-surface">
            <div className="relative aspect-square bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              {item.inUse && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-1 text-[0.6rem] font-medium text-white">
                  <CheckCircle2 className="h-3 w-3" /> Kullanımda
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium" title={item.key}>
                  {item.key.split('/').slice(1).join('/')}
                </p>
                <p className="numerals text-[0.65rem] text-muted">{kb(item.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(item.key, item.inUse)}
                disabled={busy}
                aria-label="Sil"
                className="rounded-md border border-border p-1.5 text-muted-strong hover:border-red-300 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            Görsel bulunamadı.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Medya sayfaları" className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildUrl(folder, q, page - 1)}
              className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2"
            >
              Önceki
            </Link>
          )}
          <span className="numerals px-2 text-xs text-muted-strong">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildUrl(folder, q, page + 1)}
              className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2"
            >
              Sonraki
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

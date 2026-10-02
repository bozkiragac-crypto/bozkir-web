'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Upload, Search, CheckCircle2 } from 'lucide-react';
import { deleteMediaKey, uploadMedia } from '@/app/admin/actions';

export interface MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  inUse: boolean;
}

function kb(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [folder, setFolder] = useState<'all' | 'products' | 'campaigns' | 'content'>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState<'products' | 'campaigns' | 'content'>('content');

  const filtered = useMemo(
    () =>
      items.filter((i) => (folder === 'all' || i.key.startsWith(`${folder}/`)) && (!q || i.key.toLowerCase().includes(q.toLowerCase()))),
    [items, folder, q],
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
      <h1 className="text-2xl font-medium tracking-tight">Medya kütüphanesi</h1>
      <p className="mt-1 text-sm text-muted-strong">{items.length} görsel · depolama: SeaweedFS</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-border px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Dosya ara..."
            className="h-11 w-48 bg-transparent text-sm outline-none placeholder:text-muted sm:w-64"
          />
        </div>
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value as typeof folder)}
          className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
        >
          <option value="all">Tüm klasörler</option>
          <option value="products">products</option>
          <option value="campaigns">campaigns</option>
          <option value="content">content</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value as typeof uploadFolder)}
            className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
          >
            <option value="content">content</option>
            <option value="products">products</option>
            <option value="campaigns">campaigns</option>
          </select>
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90">
            <Upload className="h-4 w-4" />
            {busy ? 'Yükleniyor...' : 'Yükle'}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => onUpload(e.target.files)} />
          </label>
        </div>
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((item) => (
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
        {filtered.length === 0 && (
          <p className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            Görsel bulunamadı.
          </p>
        )}
      </div>
    </div>
  );
}

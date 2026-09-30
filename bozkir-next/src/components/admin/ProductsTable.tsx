'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Plus, Search, Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { bulkDeleteProducts, setProductActive, importProductsCsv } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

export interface ProductRow {
  id: string;
  code: string;
  name: string;
  cat: string;
  face: string | null;
  thumb: string | null;
  isActive: boolean;
}

interface Props {
  rows: ProductRow[];
  cats: string[];
  total: number;
  page: number;
  totalPages: number;
  filters: { q: string; cat: string; sort: string; durum: string };
}

export function ProductsTable({ rows, cats, total, page, totalPages, filters }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someChecked = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  }

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.q) p.set('q', filters.q);
    if (filters.cat) p.set('kategori', filters.cat);
    if (filters.sort !== 'new') p.set('sirala', filters.sort);
    if (filters.durum !== 'all') p.set('durum', filters.durum);
    return p;
  }, [filters]);

  const pageHref = (target: number) => {
    const p = new URLSearchParams(qs.toString());
    if (target > 1) p.set('sayfa', String(target));
    return `/admin/urunler?${p.toString()}`;
  };
  const exportHref = `/admin/urunler/export?${qs.toString()}`;

  async function onBulkDelete() {
    if (!confirm(`${selected.size} ürün silinsin mi? Bu işlem geri alınamaz.`)) return;
    setBusy(true);
    setError(null);
    const res = await bulkDeleteProducts([...selected]);
    setBusy(false);
    if (!res.ok) setError('Toplu silme başarısız.');
    else {
      setSelected(new Set());
      router.refresh();
    }
  }

  async function onToggleActive(id: string, next: boolean) {
    setBusy(true);
    const res = await setProductActive(id, next);
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'Güncellenemedi.');
    else router.refresh();
  }

  async function onImport(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const text = await file.text();
    const dry = !confirm('CSV içe aktarılsın mı? (İptal = yalnızca önizleme)');
    setBusy(true);
    setError(null);
    const res = await importProductsCsv(text, dry);
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'İçe aktarma başarısız.');
    else {
      setError(null);
      alert(`Önizleme/İşlem: ${res.created} yeni, ${res.updated} güncellenecek${dry ? ' (uygulanmadı)' : ''}.`);
      if (!dry) router.refresh();
    }
  }

  const select = 'h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Ürünler</h1>
          <p className="mt-1 text-sm text-muted-strong">{total} kayıt</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={exportHref} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-surface-2">
            <Download className="h-4 w-4" /> CSV
          </a>
          <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-surface-2">
            <Upload className="h-4 w-4" /> İçe aktar
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onImport(e.target.files)} />
          </label>
          <Link
            href="/admin/urunler/yeni"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Yeni Ürün
          </Link>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-border px-4">
          <Search className="h-4 w-4 text-muted" />
          <input name="q" defaultValue={filters.q} placeholder="Ad veya kod ara..." className="h-11 w-44 bg-transparent text-sm outline-none placeholder:text-muted sm:w-56" />
        </div>
        <select name="kategori" defaultValue={filters.cat} className={select}>
          <option value="">Tüm kategoriler</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="durum" defaultValue={filters.durum} className={select}>
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
        <select name="sirala" defaultValue={filters.sort} className={select}>
          <option value="new">Yeni eklenen</option>
          <option value="code">Koda göre</option>
          <option value="name">Ada göre</option>
        </select>
        <button type="submit" className="h-11 rounded-full bg-foreground px-5 text-sm font-medium text-background">
          Filtrele
        </button>
      </form>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {someChecked && (
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm">
          <span className="numerals">{selected.size} seçili</span>
          <button
            type="button"
            onClick={onBulkDelete}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-strong hover:border-red-300 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Seçilenleri sil
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-muted underline">
            Seçimi temizle
          </button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-foreground">
            <tr>
              <th className="w-10 p-4">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Tümünü seç" />
              </th>
              <th className="p-4 font-medium">Görsel</th>
              <th className="p-4 font-medium">Kod</th>
              <th className="p-4 font-medium">Ad</th>
              <th className="p-4 font-medium">Kategori</th>
              <th className="p-4 font-medium">Durum</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-4">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`${p.code} seç`} />
                </td>
                <td className="p-4">
                  {p.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumb} alt="" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded bg-surface-2 text-[0.6rem] text-muted">yok</span>
                  )}
                </td>
                <td className="numerals p-4 text-muted-strong">{p.code}</td>
                <td className="p-4">
                  <Link href={`/admin/urunler/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="p-4 text-muted-strong">{p.cat}</td>
                <td className="p-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onToggleActive(p.id, !p.isActive)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
                      p.isActive ? 'bg-green-100 text-green-800' : 'bg-surface-2 text-muted-strong',
                    )}
                  >
                    {p.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {p.isActive ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <Link href={`/admin/urunler/${p.id}`} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2">
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-strong">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Sayfalama">
          <Link href={pageHref(Math.max(1, page - 1))} className={page === 1 ? 'pointer-events-none opacity-40' : ''}>
            Önceki
          </Link>
          <span className="numerals text-muted">
            {page} / {totalPages}
          </span>
          <Link href={pageHref(Math.min(totalPages, page + 1))} className={page === totalPages ? 'pointer-events-none opacity-40' : ''}>
            Sonraki
          </Link>
        </nav>
      )}
    </div>
  );
}

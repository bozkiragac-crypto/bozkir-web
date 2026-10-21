'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { useToast } from '@/components/ui/ToastProvider';
import { saveFeaturedProducts } from '@/lib/admin/safe-actions';

export interface FeaturedProductOption {
  id: string;
  name: string;
  code: string;
  cat: string;
  thumb: string | null;
  isActive: boolean;
}

export function FeaturedProductsEditor({
  products,
  initialIds,
  initialQuery = '',
}: {
  products: FeaturedProductOption[];
  initialIds: string[];
  initialQuery?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [ids, setIds] = useState<string[]>(initialIds);
  const [query, setQuery] = useState(initialQuery);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = ids.map((id) => byId.get(id)).filter((p): p is FeaturedProductOption => !!p);
  const selectedSet = new Set(ids);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => `${p.name} ${p.code} ${p.cat}`.toLowerCase().includes(q))
      .slice(0, 24);
  }, [products, query]);

  function add(id: string) {
    if (selectedSet.has(id) || ids.length >= 12) return;
    setIds((prev) => [...prev, id]);
  }

  function remove(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    setIds((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function save() {
    setBusy(true);
    const res = await saveFeaturedProducts(ids);
    setBusy(false);
    if (!res.ok) {
      toast(res.error ?? 'Kaydedilemedi.');
      return;
    }
    toast('Öne çıkan ürünler kaydedildi.');
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-medium">Seçili ürünler</h2>
            <p className="mt-1 text-xs text-muted">
              Ana sayfada bu sırayla gösterilir (en fazla 12).
            </p>
          </div>
          <span className="numerals rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-strong">
            {ids.length}/12
          </span>
        </div>

        {selected.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-border p-5 text-center text-sm text-muted">
            Henüz ürün seçilmedi. Sağdaki aramadan ekleyin.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border">
            {selected.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <span className="numerals w-6 flex-none text-xs text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relative h-11 w-11 flex-none overflow-hidden rounded-md bg-surface-2">
                  {p.thumb ? (
                    <SmartImage src={p.thumb} alt="" fill sizes="44px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {p.code} · {p.cat}
                    {!p.isActive ? ' · pasif' : ''}
                  </span>
                </span>
                <span className="flex flex-none gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Yukarı taşı"
                    className="rounded-md border border-border p-1.5 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === selected.length - 1}
                    aria-label="Aşağı taşı"
                    className="rounded-md border border-border p-1.5 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label={`${p.name} kaldır`}
                    className="rounded-md border border-border p-1.5 text-muted-strong hover:border-red-300 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-medium">Ürün ekle</h2>
        <p className="mt-1 text-xs text-muted">Ada, koda veya kategoriye göre ara.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            router.push(`/admin/one-cikan-urunler${q ? `?q=${encodeURIComponent(q)}` : ''}`);
          }}
        >
          <div
            data-search-shell
            className="mt-4 flex items-center gap-3 rounded-full border border-border px-4"
          >
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün ara..."
              aria-label="Öne çıkarılacak ürün ara"
              data-search-input
              className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:text-sm"
            />
          </div>
          <p className="mt-2 text-xs text-muted">Aramak için Enter’a basın.</p>
        </form>

        {query.trim() === '' ? (
          <p className="mt-6 text-sm text-muted">Aramak için yazmaya başlayın.</p>
        ) : results.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Eşleşen ürün yok.</p>
        ) : (
          <ul className="mt-4 max-h-[28rem] divide-y divide-border overflow-y-auto">
            {results.map((p) => {
              const disabled = selectedSet.has(p.id) || ids.length >= 12 || !p.isActive;
              return (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <span className="relative h-10 w-10 flex-none overflow-hidden rounded-md bg-surface-2">
                    {p.thumb ? (
                      <SmartImage src={p.thumb} alt="" fill sizes="40px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {p.code} · {p.cat}
                      {!p.isActive ? ' · pasif' : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => add(p.id)}
                    disabled={disabled}
                    className="inline-flex flex-none items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ekle
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

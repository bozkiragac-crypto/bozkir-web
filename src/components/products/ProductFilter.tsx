'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Category } from '@/types/category';
import { track } from '@/lib/analytics';

interface ProductFilterProps {
  categories: Category[];
}

/** Filtreler URL ile senkron: paylaşılabilir ve SEO dostu. */
export function ProductFilter({ categories }: ProductFilterProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const activeCategory = params.get('kategori') ?? '';

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    router.push(`/urunler${sp.toString() ? `?${sp.toString()}` : ''}`, { scroll: false });
  }

  function onCategoryChange(value: string) {
    track('filter_used', { filter: 'category', value });
    update({ kategori: value || null });
  }

  return (
    <div className="flex flex-col gap-4 border-y border-border py-5 md:flex-row md:items-center md:justify-between">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          track('search', { query });
          update({ q: query || null });
        }}
        className="flex items-center gap-3 rounded-full border border-border px-4 md:w-80"
      >
        <Search className="h-4 w-4 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Model, kod veya renk ara..."
          aria-label="Ürünlerde ara"
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {query && (
          <button
            type="button"
            aria-label="Aramayı temizle"
            onClick={() => {
              setQuery('');
              update({ q: null });
            }}
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="category-filter">
          Kategori
        </label>
        <select
          id="category-filter"
          value={activeCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none focus-visible:outline-foreground"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

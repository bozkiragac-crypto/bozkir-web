'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Category } from '@/types/category';
import { track } from '@/lib/analytics';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface ProductFilterProps {
  categories: Category[];
}

/** Filtreler URL ile senkron: paylaşılabilir ve SEO dostu. */
export function ProductFilter({ categories }: ProductFilterProps) {
  const router = useRouter();
  const params = useSearchParams();
  const routeParams = useParams();
  const { t } = useDictionary();
  const locale = typeof routeParams?.locale === 'string' ? routeParams.locale : 'tr';
  const [query, setQuery] = useState(params.get('q') ?? '');
  const activeCategory = params.get('kategori') ?? '';
  const activeSort = params.get('sirala') ?? '';

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    // Filtre/sıralama değişince ilk sayfaya dön.
    sp.delete('sayfa');
    Object.entries(next).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    router.push(`/${locale}/urunler${sp.toString() ? `?${sp.toString()}` : ''}`, { scroll: false });
  }

  function onCategoryChange(value: string) {
    track('filter_used', { filter: 'category', value });
    update({ kategori: value || null });
  }

  function onSortChange(value: string) {
    track('filter_used', { filter: 'sort', value });
    update({ sirala: value || null });
  }

  return (
    <div className="flex flex-col gap-4 border-y border-border py-5 md:flex-row md:items-center md:justify-between">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          track('search', { query });
          update({ q: query || null });
        }}
        className="flex items-center gap-3 rounded-full border border-border px-4 md:w-80"
      >
        <Search className="h-4 w-4 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('catalog.searchPlaceholder')}
          aria-label={t('catalog.search')}
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {query && (
          <button
            type="button"
            aria-label={t('catalog.clear')}
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
          {t('catalog.category')}
        </label>
        <select
          id="category-filter"
          value={activeCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-11 w-full rounded-full border border-border bg-transparent px-4 text-sm outline-none focus-visible:outline-foreground sm:w-auto"
        >
          <option value="">{t('catalog.all')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="sort-filter">
          {t('catalog.sort')}
        </label>
        <select
          id="sort-filter"
          value={activeSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="h-11 w-full rounded-full border border-border bg-transparent px-4 text-sm outline-none focus-visible:outline-foreground sm:w-auto"
        >
          <option value="">{t('catalog.sortNewest')}</option>
          <option value="name-asc">{t('catalog.sortNameAsc')}</option>
          <option value="name-desc">{t('catalog.sortNameDesc')}</option>
          <option value="code-asc">{t('catalog.sortCode')}</option>
        </select>
      </div>
    </div>
  );
}

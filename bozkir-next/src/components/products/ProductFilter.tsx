'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { Category } from '@/types/category';
import { Select } from '@/components/ui/Select';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { track } from '@/lib/analytics';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface ProductFilterProps {
  categories: Category[];
  /** Mevcut yüzey değerleri (facet). Boşsa yüzey filtresi gösterilmez. */
  surfaces?: string[];
}

/** Filtreler URL ile senkron: paylaşılabilir ve SEO dostu. Mobilde alt-sayfa. */
export function ProductFilter({ categories, surfaces = [] }: ProductFilterProps) {
  const router = useRouter();
  const params = useSearchParams();
  const routeParams = useParams();
  const { t } = useDictionary();
  const locale = typeof routeParams?.locale === 'string' ? routeParams.locale : 'tr';
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const activeCategory = params.get('kategori') ?? '';
  const activeSurface = params.get('yuzey') ?? '';
  const activeSort = params.get('sirala') ?? '';

  useFocusTrap(sheet, sheetRef);

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  // Alt-sayfa açıkken arka plan kaymasın.
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

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
  function onSurfaceChange(value: string) {
    track('filter_used', { filter: 'surface', value });
    update({ yuzey: value || null });
  }
  function onSortChange(value: string) {
    track('filter_used', { filter: 'sort', value });
    update({ sirala: value || null });
  }

  const activeCount = [activeCategory, activeSurface, activeSort].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3 border-y border-border py-5 lg:flex-row lg:items-center lg:justify-between">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          track('search', { query });
          update({ q: query || null });
        }}
        className="flex items-center gap-3 rounded-full border border-border px-4 lg:w-80"
      >
        <Search className="h-4 w-4 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('catalog.searchPlaceholder')}
          aria-label={t('catalog.search')}
          className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:text-sm"
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

      {/* Mobil: filtre/sırala bottom-sheet tetikleyici */}
      <button
        type="button"
        onClick={() => setSheet(true)}
        aria-expanded={sheet}
        aria-controls="product-filter-sheet"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        {t('catalog.filter')} · {t('catalog.sort')}
        {activeCount > 0 && (
          <span className="numerals inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-foreground px-1.5 text-[0.65rem] text-background">
            {activeCount}
          </span>
        )}
      </button>

      {/* Masaüstü: satır içi kontroller */}
      <div className="hidden flex-wrap items-center gap-3 lg:flex">
        <label className="sr-only" htmlFor="category-filter">
          {t('catalog.category')}
        </label>
        <Select
          id="category-filter"
          value={activeCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label={t('catalog.category')}
        >
          <option value="">{t('catalog.all')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>

        {surfaces.length > 0 && (
          <>
            <label className="sr-only" htmlFor="surface-filter">
              {t('product.surface')}
            </label>
            <Select
              id="surface-filter"
              value={activeSurface}
              onChange={(e) => onSurfaceChange(e.target.value)}
              aria-label={t('product.surface')}
            >
              <option value="">
                {t('product.surface')}: {t('catalog.all')}
              </option>
              {surfaces.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </>
        )}

        <label className="sr-only" htmlFor="sort-filter">
          {t('catalog.sort')}
        </label>
        <Select
          id="sort-filter"
          value={activeSort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label={t('catalog.sort')}
        >
          <option value="">{t('catalog.sortNewest')}</option>
          <option value="name-asc">{t('catalog.sortNameAsc')}</option>
          <option value="name-desc">{t('catalog.sortNameDesc')}</option>
          <option value="code-asc">{t('catalog.sortCode')}</option>
        </Select>
      </div>

      {/* Mobil bottom-sheet */}
      {sheet && (
        <div
          ref={sheetRef}
          id="product-filter-sheet"
          className="fixed inset-0 z-[200] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('catalog.filter')}
          data-lenis-prevent
          onClick={() => setSheet(false)}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-background p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-eyebrow">{t('catalog.filter')}</p>
              <button
                type="button"
                onClick={() => setSheet(false)}
                aria-label={t('search.close')}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs tracking-[0.14em] text-muted uppercase">
                  {t('catalog.category')}
                </span>
                <Select
                  value={activeCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full"
                >
                  <option value="">{t('catalog.all')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </label>

              {surfaces.length > 0 && (
                <label className="grid gap-1.5">
                  <span className="text-xs tracking-[0.14em] text-muted uppercase">
                    {t('product.surface')}
                  </span>
                  <Select
                    value={activeSurface}
                    onChange={(e) => onSurfaceChange(e.target.value)}
                    className="w-full"
                  >
                    <option value="">{t('catalog.all')}</option>
                    {surfaces.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </label>
              )}

              <label className="grid gap-1.5">
                <span className="text-xs tracking-[0.14em] text-muted uppercase">
                  {t('catalog.sort')}
                </span>
                <Select
                  value={activeSort}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="w-full"
                >
                  <option value="">{t('catalog.sortNewest')}</option>
                  <option value="name-asc">{t('catalog.sortNameAsc')}</option>
                  <option value="name-desc">{t('catalog.sortNameDesc')}</option>
                  <option value="code-asc">{t('catalog.sortCode')}</option>
                </Select>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

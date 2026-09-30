'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { track } from '@/lib/analytics';

/** Kategori içi arama: URL ile senkron (`q`), sayfalamayı sıfırlar. */
export function CategorySearch() {
  const router = useRouter();
  const params = useSearchParams();
  const routeParams = useParams();
  const { t } = useDictionary();
  const locale = typeof routeParams?.locale === 'string' ? routeParams.locale : 'tr';
  const slug = typeof routeParams?.slug === 'string' ? routeParams.slug : '';
  const [query, setQuery] = useState(params.get('q') ?? '');

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  function submit(value: string) {
    const sp = new URLSearchParams(params.toString());
    sp.delete('sayfa');
    if (value) sp.set('q', value);
    else sp.delete('q');
    const qs = sp.toString();
    router.push(`/${locale}/kategoriler/${slug}${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        track('search', { query, scope: 'category' });
        submit(query.trim());
      }}
      className="flex items-center gap-3 rounded-full border border-border px-4 md:w-80"
    >
      <Search className="h-4 w-4 text-muted" />
      <input
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
            submit('');
          }}
        >
          <X className="h-4 w-4 text-muted" />
        </button>
      )}
    </form>
  );
}

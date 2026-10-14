'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { Select } from '@/components/ui/Select';
import { track } from '@/lib/analytics';

/** URL ile senkron sıralama seçici (`sirala`); sayfalamayı sıfırlar. */
export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const routeParams = useParams();
  const { t } = useDictionary();
  const locale = typeof routeParams?.locale === 'string' ? routeParams.locale : 'tr';
  const slug = typeof routeParams?.slug === 'string' ? routeParams.slug : '';
  const basePath = slug ? `/${locale}/kategoriler/${slug}` : `/${locale}/urunler`;
  const active = params.get('sirala') ?? '';

  function onChange(value: string) {
    const sp = new URLSearchParams(params.toString());
    sp.delete('sayfa');
    if (value) sp.set('sirala', value);
    else sp.delete('sirala');
    track('filter_used', { filter: 'sort', value });
    router.push(`${basePath}${sp.toString() ? `?${sp.toString()}` : ''}`, { scroll: false });
  }

  return (
    <>
      <label className="sr-only" htmlFor="sort-filter">
        {t('catalog.sort')}
      </label>
      <Select
        id="sort-filter"
        value={active}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('catalog.sort')}
      >
        <option value="">{t('catalog.sortNewest')}</option>
        <option value="name-asc">{t('catalog.sortNameAsc')}</option>
        <option value="name-desc">{t('catalog.sortNameDesc')}</option>
        <option value="code-asc">{t('catalog.sortCode')}</option>
      </Select>
    </>
  );
}

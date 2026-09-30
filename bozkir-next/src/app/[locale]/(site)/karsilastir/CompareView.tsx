'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Scale, Trash2, X, ArrowRight } from 'lucide-react';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ShareListButton, useImportFromUrl } from '@/components/products/ListImport';
import type { Product } from '@/types/product';

export function CompareView() {
  const { compare, ready, removeCompare, clearCompare, favorites, toggleCompare } = useFavorites();
  const { t, locale } = useDictionary();
  const [details, setDetails] = useState<Record<string, Product>>({});
  const { imported } = useImportFromUrl('compare');

  useEffect(() => {
    let cancelled = false;
    const missing = compare.filter((c) => !details[c.slug]);
    if (missing.length === 0) return;
    Promise.all(
      missing.map((c) =>
        fetch(`/api/product?slug=${encodeURIComponent(c.slug)}&locale=${locale}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setDetails((prev) => {
        const next = { ...prev };
        for (const p of results) if (p && typeof p.slug === 'string') next[p.slug] = p as Product;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compare]);

  const items = compare.map((c) => ({ ref: c, product: details[c.slug] }));
  const quoteHref = `/teklif-al?urunler=${compare.map((c) => encodeURIComponent(c.slug)).join(',')}`;

  return (
    <>
      <PageHero
        eyebrow={t('compare.title')}
        title={t('compare.title')}
        description={t('compare.description')}
        crumbs={[{ label: t('common.home'), href: '/' }, { label: t('compare.title') }]}
      />
      <Container className="pb-28">
        {imported > 0 && (
          <p className="mb-6 rounded-lg border border-border bg-surface px-5 py-3 text-sm text-muted-strong">{t('favorites.imported')}</p>
        )}
        {!ready ? (
          <p className="py-20 text-center text-sm text-muted">{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Scale className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-5 text-lg">{t('compare.empty')}</p>
            <p className="mt-2 text-sm text-muted-strong">
              {t('compare.emptyHint')}
            </p>
            <Link
              href="/urunler"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-medium text-background"
            >
              {t('nav.products')}
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <p className="numerals text-sm text-muted-strong">
                {items.length}/4 {t('compare.counter')} {items.length < 2 && t('compare.minTwo')}
              </p>
              <div className="flex flex-wrap gap-3">
                <ShareListButton slugs={compare.map((c) => c.slug)} />
                <button
                  type="button"
                  onClick={clearCompare}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm text-muted-strong transition hover:border-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" /> {t('favorites.clear')}
                </button>
                <Link
                  href={quoteHref}
                  className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium ${
                    items.length >= 2 ? 'bg-foreground text-background' : 'pointer-events-none bg-surface-2 text-muted'
                  }`}
                >
                  {t('compare.quoteAll')} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Karşılaştırma tablosu */}
            <div className="mt-8 overflow-x-auto pb-4">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="w-28 pb-4 align-bottom" />
                    {items.map(({ ref, product }) => (
                      <th key={ref.slug} className="pb-4 pr-4 align-bottom">
                        <button
                          type="button"
                          onClick={() => removeCompare(ref.slug)}
                          aria-label={t('quote.removeProduct')}
                          className="float-right flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-strong transition hover:border-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Link href={`/urunler/${ref.slug}`} className="group block">
                          <div className="relative aspect-square w-32 overflow-hidden rounded-md bg-surface-2">
                            {(product?.thumbnail ?? product?.images?.[0] ?? ref.image) ? (
                              <Image
                                src={(product?.thumbnail ?? product?.images?.[0] ?? ref.image) as string}
                                alt={product?.name ?? ref.name}
                                fill
                                sizes="128px"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : null}
                          </div>
                          <p className="mt-3 max-w-[10rem] text-sm font-medium leading-snug">
                            {product?.name ?? ref.name}
                          </p>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <th className="py-4 pr-4 text-xs font-normal tracking-[0.14em] text-muted uppercase">{t('compare.code')}</th>
                    {items.map(({ ref, product }) => (
                      <td key={ref.slug} className="py-4 pr-4 numerals">
                        {product?.code ?? ref.code ?? '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-4 pr-4 text-xs font-normal tracking-[0.14em] text-muted uppercase">{t('compare.category')}</th>
                    {items.map(({ ref, product }) => (
                      <td key={ref.slug} className="py-4 pr-4">
                        {product?.category ?? ref.category}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-4 pr-4 text-xs font-normal tracking-[0.14em] text-muted uppercase">{t('compare.surface')}</th>
                    {items.map(({ ref, product }) => (
                      <td key={ref.slug} className="py-4 pr-4">
                        {(product?.face ?? ref.face) || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-4 pr-4 text-xs font-normal tracking-[0.14em] text-muted uppercase">{t('compare.thickness')}</th>
                    {items.map(({ ref, product }) => (
                      <td key={ref.slug} className="py-4 pr-4 numerals">
                        {product?.thicknesses?.length ? product.thicknesses.join(' · ') : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-4 pr-4 text-xs font-normal tracking-[0.14em] text-muted uppercase">{t('compare.actions')}</th>
                    {items.map(({ ref }) => (
                      <td key={ref.slug} className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/urunler/${ref.slug}`}
                            className="inline-flex h-9 items-center rounded-full border border-border px-3 text-xs transition hover:border-foreground"
                          >
                            {t('common.viewProduct')}
                          </Link>
                          <Link
                            href={`/teklif-al?urun=${encodeURIComponent(ref.slug)}`}
                            className="inline-flex h-9 items-center rounded-full bg-foreground px-3 text-xs text-background"
                          >
                            {t('common.getQuote')}
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Favorilerden hızlı ekleme */}
            {favorites.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-medium tracking-tight">{t('compare.addFromFavorites')}</h2>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {favorites.map((f) => {
                    const inList = compare.some((c) => c.slug === f.slug);
                    return (
                      <li key={f.slug}>
                        <button
                          type="button"
                          onClick={() => toggleCompare(f)}
                          disabled={inList}
                          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition ${
                            inList ? 'border-transparent bg-foreground text-background' : 'border-border hover:border-foreground'
                          }`}
                        >
                          {f.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}

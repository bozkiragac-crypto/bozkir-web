'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Heart, Scale, Trash2, X } from 'lucide-react';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ShareListButton, useImportFromUrl } from '@/components/products/ListImport';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

export function FavoritesView() {
  const { favorites, ready, removeFavorite, clearFavorites, toggleCompare, inCompare, compare } = useFavorites();
  const { t, locale } = useDictionary();
  const [details, setDetails] = useState<Record<string, Product>>({});
  const { imported } = useImportFromUrl('favorites');

  // Saklanan hafif referansları güncel ürün verisiyle tazele (yoksa eski haliyle göster).
  useEffect(() => {
    let cancelled = false;
    const missing = favorites.filter((f) => !details[f.slug]);
    if (missing.length === 0) return;
    Promise.all(
      missing.map((f) =>
        fetch(`/api/product?slug=${encodeURIComponent(f.slug)}&locale=${locale}`)
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
  }, [favorites]);

  const items = favorites.map((f) => ({ ref: f, product: details[f.slug] }));

  return (
    <>
      <PageHero
        eyebrow={t('favorites.title')}
        title={t('favorites.title')}
        description={t('favorites.description')}
        crumbs={[{ label: t('common.home'), href: '/' }, { label: t('favorites.title') }]}
      />
      <Container className="pb-28">
        {imported > 0 && (
          <p className="mb-6 rounded-lg border border-border bg-surface px-5 py-3 text-sm text-muted-strong">{t('favorites.imported')}</p>
        )}
        {!ready ? (
          <p className="py-20 text-center text-sm text-muted">{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-5 text-lg">{t('favorites.empty')}</p>
            <p className="mt-2 text-sm text-muted-strong">
              {t('favorites.emptyHint')}
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
                {items.length} · {compare.length}/4 {t('compare.counter')}
              </p>
              <div className="flex gap-3">
                <ShareListButton slugs={favorites.map((f) => f.slug)} />
                <button
                  type="button"
                  onClick={clearFavorites}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm text-muted-strong transition hover:border-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" /> {t('favorites.clear')}
                </button>
                <Link
                  href="/karsilastir"
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium',
                    compare.length >= 2 ? 'bg-foreground text-background' : 'pointer-events-none bg-surface-2 text-muted',
                  )}
                >
                  <Scale className="h-4 w-4" /> {t('favorites.compare')}
                </Link>
              </div>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {items.map(({ ref, product }) => (
                <li key={ref.slug} className="group relative">
                  <Link href={`/urunler/${ref.slug}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-2">
                      {product?.images?.[0] || product?.thumbnail || ref.image ? (
                        <Image
                          src={(product?.thumbnail ?? product?.images?.[0] ?? ref.image) as string}
                          alt={product?.name ?? ref.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFavorite(ref.slug)}
                    aria-label={t('favorites.remove')}
                    className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur transition hover:border-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {ref.code && <p className="numerals truncate text-xs tracking-[0.16em] text-muted uppercase">{ref.code}</p>}
                      <h3 className="mt-1 truncate text-sm font-medium sm:text-base">{product?.name ?? ref.name}</h3>
                      <p className="mt-1 truncate text-xs text-muted-strong sm:text-sm">
                        {product?.category ?? ref.category}
                        {product?.face
                          ? ` · ${t('product.surface')} ${product.face}`
                          : ref.face
                            ? ` · ${t('product.surface')} ${ref.face}`
                            : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompare(ref)}
                      aria-label={t('catalog.addCompare')}
                      aria-pressed={inCompare(ref.slug)}
                      className={cn(
                        'flex h-9 w-9 flex-none items-center justify-center rounded-full border transition',
                        inCompare(ref.slug)
                          ? 'border-transparent bg-foreground text-background'
                          : 'border-border hover:border-foreground',
                      )}
                    >
                      <Scale className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </>
  );
}

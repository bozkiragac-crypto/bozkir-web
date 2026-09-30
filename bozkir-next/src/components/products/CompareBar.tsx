'use client';

import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { usePathname } from 'next/navigation';
import { X, Scale, Trash2 } from 'lucide-react';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';

/** Karşılaştırma sepeti: sabit alt çubuk (ürün sayfasındaki mobil CTA'yı gizler). */
export function CompareBar() {
  const { compare, clearCompare, ready } = useFavorites();
  const { t } = useDictionary();
  const pathname = usePathname();
  if (!ready || compare.length === 0) return null;
  if (pathname.endsWith('/karsilastir')) return null;

  return (
    <div
      data-compare-bar
      className="fixed inset-x-0 bottom-0 z-[130] border-t border-border bg-background/95 backdrop-blur"
    >
      <div className="container-x flex items-center gap-3 py-3">
        <div className="flex -space-x-3">
          {compare.map((p) => (
            <span
              key={p.slug}
              className="relative h-12 w-12 flex-none overflow-hidden rounded-full border-2 border-background bg-surface-2"
            >
              {p.image ? <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" /> : null}
            </span>
          ))}
        </div>
        <p className="numerals hidden flex-none text-sm text-muted-strong sm:block">
          {compare.length}/4 {t('compare.counter')}
        </p>
        <div className="ml-auto flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={clearCompare}
            aria-label={t('favorites.clear')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-strong transition hover:border-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {compare.length > 1 && (
            <Link
              href="/karsilastir"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background"
            >
              <Scale className="h-4 w-4" /> {t('nav.compare')}
            </Link>
          )}
        </div>
      </div>
      {compare.length === 1 && (
        <button
          type="button"
          onClick={clearCompare}
          className="absolute top-1/2 right-2 -translate-y-1/2 sm:hidden"
          aria-label={t('favorites.remove')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

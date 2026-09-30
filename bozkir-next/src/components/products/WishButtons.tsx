'use client';

import { Heart, Scale, Check } from 'lucide-react';
import { useFavorites, type ProductRef } from '@/components/providers/FavoritesProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { cn } from '@/lib/utils';

const base =
  'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur transition hover:border-foreground';

export function FavoriteButton({ product, className }: { product: ProductRef; className?: string }) {
  const { isFavorite, toggleFavorite, ready } = useFavorites();
  const { t } = useDictionary();
  const active = ready && isFavorite(product.slug);
  const label = active ? t('favorites.remove') : t('catalog.addFavorite');

  return (
    <button
      type="button"
      aria-label={`${product.name} — ${label}`}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(product);
      }}
      className={cn(base, active && 'border-transparent bg-foreground text-background', className)}
    >
      <Heart className={cn('h-4 w-4', active && 'fill-current')} />
    </button>
  );
}

export function CompareButton({ product, className }: { product: ProductRef; className?: string }) {
  const { inCompare, toggleCompare, ready, compare } = useFavorites();
  const { t } = useDictionary();
  const active = ready && inCompare(product.slug);
  const full = compare.length >= 4 && !active;

  return (
    <button
      type="button"
      disabled={full}
      aria-label={`${product.name} — ${active ? t('quote.removeProduct') : t('catalog.addCompare')}`}
      aria-pressed={active}
      title={full ? t('catalog.compareFull') : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(product);
      }}
      className={cn(base, active && 'border-transparent bg-foreground text-background', full && 'opacity-40', className)}
    >
      {active ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
    </button>
  );
}

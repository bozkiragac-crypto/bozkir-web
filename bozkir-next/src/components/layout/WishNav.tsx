'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { Heart, Scale } from 'lucide-react';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { cn } from '@/lib/utils';

/** Header'daki favori ve karşılaştırma rozetleri. */
export function WishNav({ onDark, className }: { onDark: boolean; className?: string }) {
  const { favorites, compare, ready } = useFavorites();
  const { navLabel } = useDictionary();
  const base = () =>
    cn(
      'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors',
      onDark ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-surface-2',
    );

  const badge = (n: number) =>
    ready && n > 0 ? (
      <span className="numerals absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
        {n}
      </span>
    ) : null;

  return (
    <div className={cn('flex items-center', className)}>
      <Link href="/favoriler" className={base()} aria-label={`${navLabel('favorites')} (${favorites.length})`}>
        <Heart className="h-[18px] w-[18px]" />
        {badge(favorites.length)}
      </Link>
      <Link href="/karsilastir" className={base()} aria-label={`${navLabel('compare')} (${compare.length})`}>
        <Scale className="h-[18px] w-[18px]" />
        {badge(compare.length)}
      </Link>
    </div>
  );
}

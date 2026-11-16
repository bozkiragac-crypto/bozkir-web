'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useEffect, useRef, useState } from 'react';
import { Heart, Scale } from 'lucide-react';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { cn } from '@/lib/utils';

/** Header'daki favori ve karşılaştırma rozetleri. */
export function WishNav({ onDark, className }: { onDark: boolean; className?: string }) {
  const { favorites, compare, ready } = useFavorites();
  const { navLabel } = useDictionary();
  // Liste büyüdüğünde rozet kısa süre vurgulanır: ekleme işlemi sayfada
  // görünmese bile header'da geri bildirim kalır.
  const [pulse, setPulse] = useState<'favorites' | 'compare' | null>(null);
  const prevCounts = useRef({ favorites: 0, compare: 0 });
  const mounted = useRef(false);

  useEffect(() => {
    if (!ready) return;
    const next = { favorites: favorites.length, compare: compare.length };
    if (mounted.current) {
      if (next.favorites > prevCounts.current.favorites) setPulse('favorites');
      else if (next.compare > prevCounts.current.compare) setPulse('compare');
    }
    prevCounts.current = next;
    mounted.current = true;
  }, [favorites.length, compare.length, ready]);

  useEffect(() => {
    if (!pulse) return;
    const id = window.setTimeout(() => setPulse(null), 650);
    return () => window.clearTimeout(id);
  }, [pulse]);

  const base = () =>
    cn(
      'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors',
      onDark ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-surface-2',
    );

  const badge = (n: number, active: boolean) =>
    ready && n > 0 ? (
      <span
        key={active ? 'active' : 'idle'}
        className={cn(
          'numerals absolute top-1 end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-medium text-background',
          active && 'badge-pop',
        )}
      >
        {n}
      </span>
    ) : null;

  return (
    <div className={cn('flex items-center', className)}>
      {/* Yalnızca değişim anında duyur: ilk yüklemede sayaç okunmasın. */}
      <span className="sr-only" aria-live="polite">
        {pulse === 'favorites'
          ? `${navLabel('favorites')}: ${favorites.length}`
          : pulse === 'compare'
            ? `${navLabel('compare')}: ${compare.length}`
            : ''}
      </span>
      <Link href="/favoriler" className={base()} aria-label={`${navLabel('favorites')} (${favorites.length})`}>
        <Heart className="h-[18px] w-[18px]" />
        {badge(favorites.length, pulse === 'favorites')}
      </Link>
      <Link href="/karsilastir" className={base()} aria-label={`${navLabel('compare')} (${compare.length})`}>
        <Scale className="h-[18px] w-[18px]" />
        {badge(compare.length, pulse === 'compare')}
      </Link>
    </div>
  );
}

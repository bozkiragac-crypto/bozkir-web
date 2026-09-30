'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { FavoriteButton, CompareButton } from '@/components/products/WishButtons';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [broken, setBroken] = useState(false);
  const { t } = useDictionary();
  const image = product.thumbnail ?? product.images[0];
  const ref = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    code: product.code,
    category: product.category,
    face: product.face,
    image,
  };

  return (
    <Link href={`/urunler/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-2">
        {image && !broken ? (
          <SmartImage
            src={image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setBroken(true)}
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-muted uppercase">
            {t('catalog.imagePreparing')}
          </div>
        )}

        {/* Favori / karşılaştırma — mobilde her zaman, masaüstünde hover'da */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <FavoriteButton product={ref} />
          <CompareButton product={ref} />
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 sm:mt-4">
        <div className="min-w-0">
          {product.code && <p className="numerals truncate text-xs tracking-[0.16em] text-muted uppercase">{product.code}</p>}
          <h3 className="mt-1 text-sm font-medium tracking-tight sm:text-base">{product.name}</h3>
          <p className={cn('mt-1 text-xs text-muted-strong sm:text-sm', !product.face && 'capitalize')}>
            {product.category}
            {product.face ? ` · Yüzey ${product.face}` : ''}
          </p>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 flex-none text-muted transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

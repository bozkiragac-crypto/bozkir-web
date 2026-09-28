import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.thumbnail ?? product.images[0];

  return (
    <Link href={`/urunler/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-2">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-muted uppercase">
            Görsel eklenecek
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.code && <p className="numerals truncate text-xs tracking-[0.16em] text-muted uppercase">{product.code}</p>}
          <h3 className="mt-1 text-base font-medium tracking-tight">{product.name}</h3>
          <p className={cn('mt-1 text-sm text-muted-strong', !product.face && 'capitalize')}>
            {product.category}
            {product.face ? ` · Yüzey ${product.face}` : ''}
          </p>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 flex-none text-muted transition-colors group-hover:text-foreground" />
      </div>
    </Link>
  );
}

'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useState } from 'react';
import { ArrowUpRight, Eye } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { FavoriteButton, CompareButton } from '@/components/products/WishButtons';
import { ProductQuickView } from '@/components/products/ProductQuickView';
import type { Product } from '@/types/product';
import { cn, cssColor } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const { t } = useDictionary();
  const image = product.thumbnail ?? product.images[0];
  const secondImage = product.images.find((u) => u !== image);
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
    <>
      <Link
        href={`/urunler/${product.slug}`}
        className="group block"
        data-cursor-label={t('catalog.inspect')}
      >
        <div className="sheen relative aspect-[4/5] overflow-hidden rounded-md bg-surface-2 ring-1 ring-transparent transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:shadow-[var(--card-shadow)] group-hover:ring-border-strong">
          {image && !broken ? (
            <>
              <SmartImage
                src={image}
                alt={product.name}
                fill
                priority={priority}
                sizes="(max-width: 768px) 50vw, 25vw"
                onError={() => setBroken(true)}
                className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
              />
              {secondImage ? (
                <SmartImage
                  src={secondImage}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-out-expo)] group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <ImagePlaceholder label={t('catalog.imagePreparing')} />
          )}

          {/* Alt scrim — hover'da derinlik */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-500 ease-[var(--ease-out-expo)] group-hover:opacity-100"
          />

          {/* Favori / karşılaştırma — mobilde her zaman, masaüstünde hover'da */}
          <div className="absolute end-2 top-2 flex flex-col gap-2 opacity-100 transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] md:translate-x-2 md:opacity-0 md:group-focus-within:translate-x-0 md:group-focus-within:opacity-100 md:group-hover:translate-x-0 md:group-hover:opacity-100">
            <FavoriteButton product={ref} />
            <CompareButton product={ref} />
            <button
              type="button"
              aria-label={`${product.name} — ${t('catalog.quickView')}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickOpen(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur transition hover:border-foreground"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3 sm:mt-4">
          <div className="min-w-0">
            {product.code && (
              <p className="numerals truncate text-xs tracking-[0.16em] text-muted uppercase">
                {product.code}
              </p>
            )}
            <h3 className="link-underline-group mt-1 inline-block text-sm font-medium tracking-tight sm:text-base">
              {product.name}
            </h3>
            <p
              className={cn(
                'mt-1 text-xs text-muted-strong sm:text-sm',
                !product.face && 'capitalize',
              )}
            >
              {product.category}
              {product.face ? ` · ${t('product.surface')} ${product.face}` : ''}
            </p>
            {product.colors?.length || product.thicknesses?.length ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 opacity-100 transition-opacity duration-300 ease-[var(--ease-out-expo)] md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                {product.colors?.slice(0, 5).map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[0.62rem] capitalize text-muted-strong"
                  >
                    {cssColor(c) ? (
                      <span
                        className="h-2 w-2 rounded-full border border-border"
                        style={{ backgroundColor: cssColor(c) }}
                        aria-hidden
                      />
                    ) : null}
                    {c}
                  </span>
                ))}
                {product.thicknesses?.slice(0, 4).map((th) => (
                  <span
                    key={th}
                    className="numerals rounded-full border border-border px-2 py-0.5 text-[0.62rem] text-muted-strong"
                  >
                    {th}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 flex-none text-muted transition-[transform,color] duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
        </div>
      </Link>
      <ProductQuickView product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}

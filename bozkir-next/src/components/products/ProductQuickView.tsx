'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { SmartImage } from '@/components/ui/SmartImage';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { FavoriteButton, CompareButton } from '@/components/products/WishButtons';
import { ShareButton } from '@/components/products/ShareButton';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { cn, cssColor } from '@/lib/utils';
import type { Product } from '@/types/product';

/**
 * Hızlı Bakış katmanı: ürün özeti + teklif/favori aksiyonları.
 * Odak tuzağı, ESC ve scroll kilidi (ImageLightbox ile aynı desen).
 */
export function ProductQuickView({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { t, locale } = useDictionary();
  const [origin, setOrigin] = useState('');
  useFocusTrap(open, ref);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const image = product.thumbnail ?? product.images[0];
  const description = product.shortDescription ?? product.description;
  const pRef = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    code: product.code,
    category: product.category,
    face: product.face,
    image,
  };

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[290] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      data-lenis-prevent
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[90dvh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-lg border border-border bg-background shadow-2xl md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('home.gallery.close')}
          className="absolute end-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur transition hover:border-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-square bg-surface-2 md:aspect-auto md:h-full">
          {image ? (
            <SmartImage
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <ImagePlaceholder label={t('catalog.imagePreparing')} />
          )}
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-8">
          <div>
            {product.code && (
              <p className="numerals text-xs tracking-[0.16em] text-muted uppercase">
                {product.code}
              </p>
            )}
            <h2 className="mt-1 text-xl font-medium tracking-tight md:text-2xl">{product.name}</h2>
            <p className={cn('mt-1 text-sm text-muted-strong', !product.face && 'capitalize')}>
              {product.category}
              {product.face ? ` · ${t('product.surface')} ${product.face}` : ''}
            </p>
          </div>

          {description && (
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-strong">{description}</p>
          )}

          {product.colors?.length || product.thicknesses?.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {product.colors?.slice(0, 8).map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs capitalize text-muted-strong"
                >
                  {cssColor(c) ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-border"
                      style={{ backgroundColor: cssColor(c) }}
                      aria-hidden
                    />
                  ) : null}
                  {c}
                </span>
              ))}
              {product.thicknesses?.slice(0, 6).map((th) => (
                <span
                  key={th}
                  className="numerals rounded-full border border-border px-2.5 py-1 text-xs text-muted-strong"
                >
                  {th}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <Link
              href={`/teklif-al?urun=${encodeURIComponent(product.slug)}`}
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t('common.getQuote')}
            </Link>
            <Link
              href={`/urunler/${product.slug}`}
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-strong text-sm font-medium transition-colors hover:bg-surface-2"
            >
              {t('common.viewProduct')} <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <FavoriteButton product={pRef} className="h-11 w-11" />
              <CompareButton product={pRef} className="h-11 w-11" />
              <ShareButton
                name={product.name}
                url={`${origin}/${locale}/urunler/${product.slug}`}
                imageUrl={image}
                className="h-11 w-11"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

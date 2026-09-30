'use client';

import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface ShowcaseItem {
  id: string;
  url: string;
  title: string;
  tag: string;
  href?: string;
}

const MAX_ITEMS = 12;

/**
 * "Malzeme Vitrini" — ürün mozaik ızgarası.
 * Kare ürün görselleri kırpılmadan gösterilir; hover'da hafif zoom,
 * tıklayınca ürün sayfası, büyütme simgesiyle lightbox açılır.
 */
export function GalleryShowcase({ items: allItems }: { items: ShowcaseItem[] }) {
  const items = allItems.slice(0, MAX_ITEMS);
  const count = items.length;
  const { t } = useDictionary();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  useFocusTrap(lightbox !== null, lightboxRef);

  // Lightbox klavye + scroll kilidi.
  useEffect(() => {
    if (lightbox === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : (i - 1 + count) % count));
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? null : (i + 1) % count));
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [lightbox, count]);

  if (count === 0) return null;

  const current = lightbox !== null ? items[lightbox] : null;

  return (
    <>
      <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-4 md:gap-y-10 lg:grid-cols-4">
        {items.map((item, i) => {
          const href = item.href ?? (item.tag ? `/urunler?q=${encodeURIComponent(item.tag)}` : '/urunler');
          return (
            <li key={item.id} className="group relative">
              <Link href={href} className="block">
                <div className="relative aspect-square overflow-hidden rounded-md bg-surface-2">
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-12">
                    {item.tag && (
                      <span className="text-[0.62rem] tracking-[0.14em] text-white/70 uppercase">{item.tag}</span>
                    )}
                    <span className="mt-1 block truncate text-sm font-medium text-white md:text-base">{item.title}</span>
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setLightbox(i)}
                aria-label={t('home.gallery.expand')}
                className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/50 group-hover:opacity-100"
              >
                <Expand className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {current && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label={t('home.gallery.close')}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox! - 1 + count) % count);
            }}
            aria-label={t('home.gallery.prev')}
            className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white md:left-8"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <figure className="relative h-[80vh] w-[92vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={current.url} alt={current.title || ''} fill sizes="92vw" className="object-contain" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-center text-sm text-white">
              {current.tag && <span className="mr-2 text-white/70">{current.tag}</span>}
              {current.title}
              <span className="numerals ml-3 text-white/60">
                {lightbox! + 1} / {count}
              </span>
              <Link
                href={current.href ?? `/urunler${current.tag ? `?q=${encodeURIComponent(current.tag)}` : ''}`}
                onClick={() => setLightbox(null)}
                className="ml-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-white/90"
              >
                {t('common.viewProduct')} <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </figcaption>
          </figure>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox! + 1) % count);
            }}
            aria-label={t('home.gallery.next')}
            className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white md:right-8"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      )}
    </>
  );
}

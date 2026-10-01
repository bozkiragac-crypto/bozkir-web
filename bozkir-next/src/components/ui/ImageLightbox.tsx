'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface LightboxItem {
  url: string;
  alt: string;
  title?: string;
  tag?: string;
  href?: string;
}

/** Görsel büyütme katmanı: odak tuzağı, ESC/ok tuşları, scroll kilidi. */
export function ImageLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const count = items.length;
  const current = index !== null ? items[index] : null;
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useDictionary();
  useFocusTrap(current !== null, ref);

  useEffect(() => {
    if (index === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count);
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [index, count, onClose, onIndexChange]);

  if (!current) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={current.title ?? current.alt}
      data-lenis-prevent
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('home.gallery.close')}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
      >
        <X className="h-6 w-6" />
      </button>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index! - 1 + count) % count);
          }}
          aria-label={t('home.gallery.prev')}
          className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white md:left-8"
        >
          <ChevronLeft className="h-7 w-7 rtl:-scale-x-100" />
        </button>
      )}

      <figure className="relative h-[80vh] w-[92vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <Image src={current.url} alt={current.alt} fill sizes="92vw" className="object-contain" />
        {(current.title || current.href) && (
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-center text-sm text-white">
            {current.tag && <span className="me-2 text-white/70">{current.tag}</span>}
            {current.title}
            {count > 1 && (
              <span className="numerals ms-3 text-white/60">
                {index! + 1} / {count}
              </span>
            )}
            {current.href && (
              <Link
                href={current.href}
                onClick={onClose}
                className="ms-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-white/90"
              >
                {t('common.viewProduct')} <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </figcaption>
        )}
      </figure>

      {count > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index! + 1) % count);
          }}
          aria-label={t('home.gallery.next')}
          className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white md:right-8"
        >
          <ChevronRight className="h-7 w-7 rtl:-scale-x-100" />
        </button>
      )}
    </div>
  );
}

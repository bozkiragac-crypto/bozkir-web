'use client';

import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useState } from 'react';
import { Expand } from 'lucide-react';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { ImageLightbox, type LightboxItem } from '@/components/ui/ImageLightbox';

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

  if (count === 0) return null;

  const hrefOf = (item: ShowcaseItem) =>
    item.href ?? (item.tag ? `/urunler?q=${encodeURIComponent(item.tag)}` : '/urunler');

  const lightboxItems: LightboxItem[] = items.map((item) => ({
    url: item.url,
    alt: item.title,
    title: item.title,
    tag: item.tag,
    href: hrefOf(item),
  }));

  return (
    <>
      <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-4 md:gap-y-10 lg:grid-cols-4">
        {items.map((item, i) => (
          <li key={item.id} className="group relative">
            <Link href={hrefOf(item)} className="block">
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
              className="absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <Expand className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <ImageLightbox
        items={lightboxItems}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
      />
    </>
  );
}

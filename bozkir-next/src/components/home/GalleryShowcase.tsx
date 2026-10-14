'use client';

import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useMemo, useState } from 'react';
import { Expand, ArrowUpRight } from 'lucide-react';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { ImageLightbox, type LightboxItem } from '@/components/ui/ImageLightbox';
import { Reveal } from '@/components/animations/Reveal';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/utils';
import { STAGGER } from '@/lib/motion';

export interface ShowcaseItem {
  id: string;
  url: string;
  title: string;
  tag: string;
  href?: string;
}

const MAX_ITEMS = 12;

// Editoryal ritim: değişken oran deseni (döngüsel).
const RATIOS = ['aspect-[4/5]', 'aspect-square', 'aspect-square', 'aspect-[3/4]'];

/**
 * "Malzeme Vitrini" — editoryal mozaik (CSS columns).
 * Değişken oranlı tile'lar, hover'da zoom + beliren caption, kategori çipleriyle
 * filtreleme, lightbox ve "tümünü gör" CTA'sı.
 */
export function GalleryShowcase({ items: allItems }: { items: ShowcaseItem[] }) {
  const items = allItems.slice(0, MAX_ITEMS);
  const count = items.length;
  const { t } = useDictionary();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [filter, setFilter] = useState('');

  const tags = useMemo(() => Array.from(new Set(items.map((i) => i.tag).filter(Boolean))), [items]);
  const shown = filter ? items.filter((i) => i.tag === filter) : items;

  if (count === 0) return null;

  const hrefOf = (item: ShowcaseItem) =>
    item.href ?? (item.tag ? `/urunler?q=${encodeURIComponent(item.tag)}` : '/urunler');

  const lightboxItems: LightboxItem[] = shown.map((item) => ({
    url: item.url,
    alt: item.title,
    title: item.title,
    tag: item.tag,
    href: hrefOf(item),
  }));

  const chipClass = (active: boolean) =>
    cn(
      'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'border-transparent bg-foreground text-background'
        : 'border-border text-muted-strong hover:border-foreground hover:text-foreground',
    );

  return (
    <>
      {tags.length > 1 && (
        <Container className="mt-10 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFilter('')} className={chipClass(!filter)}>
            {t('catalog.all')}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilter(tag)}
              className={chipClass(filter === tag)}
            >
              {tag}
            </button>
          ))}
        </Container>
      )}

      <ul className="mt-6 columns-2 gap-3 md:mt-8 md:columns-3 md:gap-4 lg:columns-4">
        {shown.map((item, i) => (
          <Reveal
            as="li"
            key={item.id}
            delay={(i % 4) * STAGGER.list}
            className="group relative mb-3 break-inside-avoid md:mb-4"
          >
            <Link href={hrefOf(item)} className="block" data-cursor-label={t('catalog.inspect')}>
              <div
                className={cn(
                  'relative w-full overflow-hidden rounded-md bg-surface-2 ring-1 ring-transparent transition-[box-shadow] duration-500 ease-[var(--ease-out-expo)] group-hover:ring-border-strong',
                  RATIOS[i % RATIOS.length],
                )}
              >
                <Image
                  src={item.url}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-12 md:translate-y-2 md:opacity-0 md:transition-[opacity,transform] md:duration-500 md:ease-[var(--ease-out-expo)] md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                  {item.tag && (
                    <span className="text-[0.62rem] tracking-[0.14em] text-white/70 uppercase">
                      {item.tag}
                    </span>
                  )}
                  <span className="font-display mt-1 flex items-center gap-1.5 text-base text-white md:text-lg">
                    <span className="truncate">{item.title}</span>
                    <ArrowUpRight className="h-4 w-4 flex-none transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setLightbox(i)}
              aria-label={t('home.gallery.expand')}
              className="absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-100 backdrop-blur-sm transition hover:bg-black/50 md:opacity-0 md:group-focus-visible:opacity-100 md:group-hover:opacity-100"
            >
              <Expand className="h-4 w-4" />
            </button>
          </Reveal>
        ))}
      </ul>

      <Container className="mt-12">
        <Link href="/urunler" className="group inline-flex items-center gap-2 text-sm font-medium">
          {t('common.allProducts')}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </Container>

      <ImageLightbox
        items={lightboxItems}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
      />
    </>
  );
}

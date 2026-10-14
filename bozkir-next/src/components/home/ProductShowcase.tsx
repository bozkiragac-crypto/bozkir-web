import { SmartImage as Image } from '@/components/ui/SmartImage';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '@/types/category';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { HorizontalScroll } from '@/components/animations/HorizontalScroll';
import { cn } from '@/lib/utils';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Öne çıkan kategori vitrini — yatay kaydırılabilir, editoryal kartlar. */
export async function ProductShowcase({
  categories,
  locale,
}: {
  categories: Category[];
  locale: Locale;
}) {
  const dict = dictFor(locale);
  const h = dict.home.showcase;
  const items = categories.filter((c) => c.featured).slice(0, 9);
  if (items.length === 0) return null;

  return (
    <HorizontalScroll
      id="koleksiyon"
      aria-label={h.ariaLabel}
      header={
        <SectionHeading
          eyebrow={h.eyebrow}
          title={h.title}
          action={
            <Link
              href="/urunler"
              className="group inline-flex items-center gap-2 text-sm font-medium"
            >
              {h.catalogCta}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          }
        />
      }
    >
      {items.map((category, i) => (
        <article
          key={category.id}
          className={cn(
            'w-[80vw] flex-none snap-start sm:w-[58vw] lg:w-[clamp(300px,24vw,380px)]',
            // Hafif, temiz ritim: tek indeksli kartlar bir kademe aşağıda.
            i % 2 === 1 && 'lg:mt-10',
          )}
        >
          <Link
            href={`/kategoriler/${category.slug}`}
            data-cursor-label={h.cursorOpen}
            className="group relative block overflow-hidden rounded-xl bg-surface-2"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              {category.heroImage ? (
                <Image
                  src={category.heroImage}
                  alt={category.name}
                  fill
                  sizes="(max-width: 1024px) 80vw, 24vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-muted uppercase">
                  {h.imageSoon}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              <span className="numerals absolute start-5 top-5 text-xs tracking-[0.2em] text-white/70">
                {String(i + 1).padStart(2, '0')}
              </span>
              {category.productCount ? (
                <span className="numerals absolute end-5 top-5 rounded-full bg-white/15 px-3 py-1 text-[0.65rem] tracking-[0.12em] text-white uppercase backdrop-blur-sm">
                  {category.productCount} {h.productWord}
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 p-6">
                {category.shortDescription && (
                  <p className="text-[0.68rem] tracking-[0.16em] text-white/70 uppercase">
                    {category.shortDescription}
                  </p>
                )}
                <h3 className="font-display mt-1.5 text-2xl tracking-tight text-white md:text-[1.75rem]">
                  {category.name}
                </h3>
                <div className="md:translate-y-2 md:opacity-0 md:transition-[opacity,transform] md:duration-500 md:ease-[var(--ease-out-expo)] md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                  <span className="mt-4 inline-flex items-center gap-2 text-sm text-white/85">
                    {h.collectionCta}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </article>
      ))}
    </HorizontalScroll>
  );
}

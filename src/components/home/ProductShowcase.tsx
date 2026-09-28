import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '@/types/category';
import { HorizontalScroll } from '@/components/animations/HorizontalScroll';

interface ProductShowcaseProps {
  categories: Category[];
}

export function ProductShowcase({ categories }: ProductShowcaseProps) {
  const items = categories.filter((c) => c.featured).slice(0, 8);

  return (
    <HorizontalScroll
      aria-label="Malzeme koleksiyonu"
      header={
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="text-eyebrow">Öne Çıkanlar</p>
            <h2 className="text-headline mt-4">Malzeme koleksiyonu</h2>
          </div>
          <Link href="/urunler" className="group inline-flex items-center gap-2 text-sm font-medium">
            Kataloğa git
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      }
    >
      {items.map((category) => (
        <article key={category.id} className="w-[78vw] flex-none snap-start sm:w-[46vw] lg:w-[34vw] xl:w-[30vw]">
          <Link href={`/kategoriler/${category.slug}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-surface-2">
              {category.heroImage ? (
                <Image
                  src={category.heroImage}
                  alt={category.name}
                  fill
                  sizes="(max-width: 1024px) 78vw, 34vw"
                  className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-muted uppercase">
                  Görsel eklenecek
                </div>
              )}
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.16em] text-muted uppercase">{category.shortDescription}</p>
                <h3 className="mt-2 text-2xl font-medium tracking-tight">{category.name}</h3>
              </div>
              <ArrowUpRight className="mt-1 h-5 w-5 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </div>
          </Link>
        </article>
      ))}
    </HorizontalScroll>
  );
}

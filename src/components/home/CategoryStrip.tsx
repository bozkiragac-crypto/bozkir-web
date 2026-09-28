import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '@/types/category';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';

interface CategoryStripProps {
  categories: Category[];
}

export function CategoryStrip({ categories }: CategoryStripProps) {
  const items = categories.filter((c) => c.featured).slice(0, 8);

  return (
    <Container className="py-24 md:py-32">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <p className="text-eyebrow">Kategoriler</p>
          <h2 className="text-headline mt-4">Ürün yelpazesi</h2>
        </div>
        <Link href="/urunler" className="group inline-flex items-center gap-2 text-sm font-medium">
          Tüm ürünler
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {items.map((category, i) => (
          <Reveal key={category.id} delay={i * 0.04}>
            <Link href={`/kategoriler/${category.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-2">
                {category.thumbnail ? (
                  <Image
                    src={category.thumbnail}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-muted uppercase">
                    Görsel eklenecek
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-medium tracking-tight">{category.name}</h3>
                  {category.shortDescription && (
                    <p className="mt-1 text-sm text-muted-strong">{category.shortDescription}</p>
                  )}
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 flex-none text-muted transition-colors group-hover:text-foreground" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

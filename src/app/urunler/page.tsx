import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getCategories } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ProductFilter } from '@/components/products/ProductFilter';
import { ProductCard } from '@/components/products/ProductCard';

const PAGE_SIZE = 24;

export const metadata: Metadata = buildMetadata({
  title: 'Ürünler | Bozkır Ağaç Ürünleri',
  description:
    'MDF lam, lake panel, suntalam, sunta, MDF, pervaz, PVC kenar bant ve tutkal ürün grupları. Renk ve kategoriye göre keşfedin.',
  path: '/urunler',
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined) {
  return typeof v === 'string' ? v : undefined;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const kategori = str(sp.kategori);
  const q = str(sp.q);
  const page = Math.max(1, parseInt(str(sp.sayfa) ?? '1', 10) || 1);

  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({ category: kategori, query: q, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (kategori) params.set('kategori', kategori);
    if (target > 1) params.set('sayfa', String(target));
    const qs = params.toString();
    return `/urunler${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <PageHero
        eyebrow="Katalog"
        title="Ürünler"
        description="Mobilya ve iç mekân üretimi için panel, yüzey ve tamamlayıcı ürün grupları."
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Ürünler' },
        ]}
      >
        <div className="mt-10">
          <Suspense fallback={<div className="h-20" />}>
            <ProductFilter categories={categories} />
          </Suspense>
        </div>
      </PageHero>

      <Container className="pb-24 md:pb-32">
        {result.items.length > 0 ? (
          <>
            <p className="numerals mb-8 text-sm text-muted">
              {result.total} ürün{totalPages > 1 ? ` · sayfa ${page}/${totalPages}` : ''}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {result.items.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-16 flex items-center justify-between border-t border-border pt-8" aria-label="Sayfalama">
                {page > 1 ? (
                  <Link href={buildHref(page - 1)} className="inline-flex items-center gap-2 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4" /> Önceki
                  </Link>
                ) : (
                  <span />
                )}
                <span className="numerals text-sm text-muted">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link href={buildHref(page + 1)} className="inline-flex items-center gap-2 text-sm font-medium">
                    Sonraki <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-12 text-center">
            <h2 className="text-xl font-medium tracking-tight">Sonuç bulunamadı</h2>
            <p className="mt-3 text-sm text-muted-strong">
              Arama veya filtreyi değiştirip tekrar deneyin.
            </p>
          </div>
        )}
      </Container>
    </>
  );
}

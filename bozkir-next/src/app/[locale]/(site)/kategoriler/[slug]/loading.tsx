import { Container } from '@/components/ui/Container';
import { ProductSkeleton } from '@/components/products/ProductSkeleton';

/** Kategori detay iskeleti: arama + sıralama, hero görseli, ürün grid'i. */
export default function Loading() {
  return (
    <div aria-hidden className="animate-pulse">
      <Container className="pt-32 pb-10 md:pt-40">
        <div className="h-4 w-40 rounded bg-surface-2" />
        <div className="mt-6 h-12 w-72 max-w-full rounded bg-surface-2" />
        <div className="mt-4 h-4 w-96 max-w-full rounded bg-surface-2" />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <div className="h-11 w-full rounded-full bg-surface-2 sm:w-80" />
          <div className="h-11 w-full rounded-full bg-surface-2 sm:w-40" />
        </div>
      </Container>
      <Container className="pb-16">
        <div className="aspect-[4/3] rounded-lg bg-surface-2 md:aspect-[21/9]" />
      </Container>
      <Container className="pb-24 md:pb-32">
        <div className="mb-8 h-4 w-32 rounded bg-surface-2" />
        <ProductSkeleton />
      </Container>
    </div>
  );
}

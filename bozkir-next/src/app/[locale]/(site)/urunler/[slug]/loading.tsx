import { Container } from '@/components/ui/Container';

/** Ürün detayı için iskelet: galeri + spec/CTA + benzer ürünler. */
export default function Loading() {
  return (
    <Container className="pt-[calc(var(--header-height)+clamp(40px,7vw,96px))] pb-24 md:pb-32">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-6 h-12 w-2/3 max-w-xl" />

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="skeleton aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-full" />
          ))}
          <div className="skeleton mt-6 h-12 w-56 rounded-full" />
        </div>
      </div>

      <div className="mt-24 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5] w-full" />
            <div className="skeleton mt-4 h-3 w-3/4" />
            <div className="skeleton mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </Container>
  );
}

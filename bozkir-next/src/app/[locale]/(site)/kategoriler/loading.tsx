import { Container } from '@/components/ui/Container';

export default function Loading() {
  return (
    <Container className="pt-[calc(var(--header-height)+clamp(40px,7vw,96px))] pb-24 md:pb-32">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton mt-6 h-12 w-2/3 max-w-xl" />
      <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
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

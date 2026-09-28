import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Container className="flex min-h-svh flex-col justify-center pt-[var(--header-height)]">
      <p className="text-eyebrow">Hata 404</p>
      <h1 className="text-display mt-6">Sayfa bulunamadı.</h1>
      <p className="mt-6 max-w-md text-muted-strong">
        Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <ButtonLink href="/" size="lg">
          Ana Sayfa
        </ButtonLink>
        <ButtonLink href="/urunler" size="lg" variant="outline">
          Ürünler
        </ButtonLink>
      </div>
      <p className="mt-12 text-sm text-muted">
        Aradığınız ürünü <Link href="/urunler" className="underline">katalogda</Link> bulabilirsiniz.
      </p>
    </Container>
  );
}

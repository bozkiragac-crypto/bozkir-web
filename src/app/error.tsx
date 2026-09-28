'use client';

import { useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Gerçek uygulamada merkezi hata izleme servisine gönderilir.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-svh flex-col justify-center pt-[var(--header-height)]">
      <p className="text-eyebrow">Bir şeyler ters gitti</p>
      <h1 className="text-headline mt-6">İçerik yüklenemedi.</h1>
      <p className="mt-6 max-w-md text-muted-strong">
        Bağlantı sorunu yaşanmış olabilir. Tekrar deneyebilir veya ana sayfaya dönebilirsiniz.
      </p>
      <div className="mt-10">
        <Button size="lg" onClick={reset}>
          Tekrar Dene
        </Button>
      </div>
    </Container>
  );
}

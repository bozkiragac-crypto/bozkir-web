'use client';

import { useEffect } from 'react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { Container } from '@/components/ui/Container';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useDictionary } from '@/i18n/DictionaryProvider';

/** Sayfa düzeyinde hata sınırı: site kabuğu korunur, kullanıcıya yeniden deneme sunulur. */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dict } = useDictionary();
  const e = dict.pages.error;

  useEffect(() => {
    // Sunucu loglarında izlenebilsin (istemci konsolu).
    console.error(error);
  }, [error]);

  return (
    <Container className="relative flex min-h-[70svh] flex-col justify-center py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(80%_60%_at_18%_8%,rgba(141,132,116,0.10),transparent_60%)]"
      />
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -top-4 end-2 select-none text-[clamp(7rem,24vw,18rem)] leading-none text-foreground/[0.04] md:end-8"
      >
        !
      </span>
      <div className="relative mb-10">
        <BrandLogo className="h-16" />
      </div>
      <p className="text-eyebrow">{e.eyebrow}</p>
      <h1 className="text-display mt-8 max-w-3xl">
        {e.titleLead} <em className="text-editorial">{e.titleEm}</em>
      </h1>
      <p className="mt-8 max-w-md text-muted-strong">{e.body}</p>
      <div className="mt-12 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-medium text-background"
        >
          {e.retry}
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full border border-border px-7 text-sm font-medium"
        >
          {e.home}
        </Link>
      </div>
    </Container>
  );
}

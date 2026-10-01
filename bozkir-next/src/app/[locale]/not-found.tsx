'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { Container } from '@/components/ui/Container';
import { useDictionary } from '@/i18n/DictionaryProvider';

/** Dil önekli bilinmeyen adresler için site kabuğu içinde 404. */
export default function LocaleNotFound() {
  const { dict } = useDictionary();
  const nf = dict.pages.notFound;

  return (
    <Container className="flex min-h-[70svh] flex-col justify-center py-24">
      <p className="text-eyebrow">{nf.eyebrow}</p>
      <h1 className="text-display mt-8 max-w-3xl">
        {nf.titleLead} <em className="text-editorial">{nf.titleEm}</em>
      </h1>
      <p className="mt-8 max-w-md text-muted-strong">{nf.body}</p>
      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-medium text-background"
        >
          {nf.home}
        </Link>
        <Link
          href="/urunler"
          className="inline-flex h-12 items-center rounded-full border border-border px-7 text-sm font-medium"
        >
          {nf.products}
        </Link>
      </div>
    </Container>
  );
}

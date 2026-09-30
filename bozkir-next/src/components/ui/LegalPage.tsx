import type { ReactNode } from 'react';
import { Container } from './Container';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export async function LegalPage({
  title,
  updated,
  locale,
  children,
}: {
  title: string;
  updated: string;
  locale: Locale;
  children: ReactNode;
}) {
  const l = dictFor(locale).pages.legal;
  return (
    <Container className="pt-[calc(var(--header-height)+80px)] pb-24 md:pb-32">
      <p className="text-eyebrow">{l.eyebrow}</p>
      <h1 className="text-headline mt-5">{title}</h1>
      <p className="mt-4 text-sm text-muted">
        {l.updated}: {updated}
      </p>

      <div className="mt-8 max-w-3xl rounded-lg border border-border bg-surface p-5 text-sm text-muted-strong">
        {l.disclaimer}
      </div>

      <div className="mt-12 max-w-3xl space-y-8 text-muted-strong">{children}</div>
    </Container>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

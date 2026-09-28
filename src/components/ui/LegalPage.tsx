import type { ReactNode } from 'react';
import { Container } from './Container';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Container className="pt-[calc(var(--header-height)+80px)] pb-24 md:pb-32">
      <p className="text-eyebrow">Yasal</p>
      <h1 className="text-headline mt-5">{title}</h1>
      <p className="mt-4 text-sm text-muted">Son güncelleme: {updated}</p>

      <div className="mt-8 max-w-3xl rounded-lg border border-border bg-surface p-5 text-sm text-muted-strong">
        Bu metin genel bir taslaktır ve yayına almadan önce hukuki incelemeden geçirilmesi önerilir.
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

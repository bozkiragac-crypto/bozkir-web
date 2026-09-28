import Link from 'next/link';
import type { ReactNode } from 'react';
import { Container } from './Container';

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  crumbs?: Crumb[];
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, crumbs, children }: PageHeroProps) {
  return (
    <section className="pt-[calc(var(--header-height)+clamp(40px,7vw,96px))] pb-12 md:pb-16">
      <Container>
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Menü yolu" className="mb-8 flex flex-wrap items-center gap-2 text-xs tracking-[0.08em] text-muted uppercase">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-2">
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
                {i < crumbs.length - 1 && <span aria-hidden>/</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="text-eyebrow">{eyebrow}</p>}
        <h1 className="text-headline mt-5 max-w-4xl">{title}</h1>
        {description && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-strong">{description}</p>}
        {children}
      </Container>
    </section>
  );
}

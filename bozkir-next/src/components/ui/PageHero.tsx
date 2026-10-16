'use client';

import NextImage from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import type { ReactNode } from 'react';
import { Container } from './Container';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  crumbs?: Crumb[];
  /** Başlıktan önce gösterilecek ek öğe (ör. logo). */
  leading?: ReactNode;
  children?: ReactNode;
  /** Opsiyonel arka plan görseli (koyu overlay ile; içerik açık renge döner). */
  image?: string;
  imageAlt?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  leading,
  children,
  image,
  imageAlt,
}: PageHeroProps) {
  const { dict } = useDictionary();
  const onDark = Boolean(image);

  return (
    <section
      className={cn(
        'relative isolate pt-[calc(var(--header-height)+clamp(40px,7vw,96px))] pb-12 md:pb-16',
        onDark && 'text-white',
      )}
    >
      {image && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <NextImage
            src={image}
            alt={imageAlt ?? ''}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-background" />
        </div>
      )}
      <Container>
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label={dict.common.breadcrumb}
            className={cn(
              'no-print mb-8 flex flex-wrap items-center gap-2 text-xs tracking-[0.08em] uppercase',
              onDark ? 'text-white/70' : 'text-muted',
            )}
          >
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-2">
                {c.href ? (
                  <Link
                    href={c.href}
                    className={cn(
                      'link-underline transition-colors',
                      onDark ? 'hover:text-white' : 'hover:text-foreground',
                    )}
                  >
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
        {leading}
        {eyebrow && <p className={cn('text-eyebrow', onDark && 'text-white/80')}>{eyebrow}</p>}
        <h1 className="text-headline mt-5 max-w-4xl break-words">{title}</h1>
        {description && (
          <p
            className={cn(
              'mt-6 max-w-2xl text-lg leading-relaxed',
              onDark ? 'text-white/80' : 'text-muted-strong',
            )}
          >
            {description}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}

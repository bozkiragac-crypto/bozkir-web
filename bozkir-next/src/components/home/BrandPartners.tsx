import { SmartImage as Image } from '@/components/ui/SmartImage';
import type { Brand } from '@/types/brand';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn } from '@/lib/utils';
import { safeHref } from '@/lib/safe-url';
import { dictFor } from '@/i18n/server';
import type { CSSProperties } from 'react';
import type { Locale } from '@/i18n/config';

const cell =
  'flex w-52 flex-none flex-col items-center justify-center gap-4 border-s border-border px-8 py-6 text-center transition-colors hover:bg-surface-2';

export async function BrandPartners({ brands, locale }: { brands: Brand[]; locale: Locale }) {
  const dict = dictFor(locale);
  if (brands.length === 0) return null;

  const categoryOf = (brand: Brand) =>
    locale === 'en'
      ? (brand.categoryEn ?? brand.category)
      : locale === 'ar'
        ? (brand.categoryAr ?? brand.category)
        : brand.category;

  const content = (brand: Brand) => (
    <>
      <Image
        src={brand.logo}
        alt={brand.name}
        width={brand.width ?? 140}
        height={brand.height ?? 56}
        className="h-12 w-auto object-contain transition-all duration-500 md:opacity-60 md:grayscale md:group-hover:opacity-100 md:group-hover:grayscale-0"
      />
      <div>
        <p className="text-sm font-medium">{brand.name}</p>
        {brand.category && <p className="mt-1 text-xs text-muted">{categoryOf(brand)}</p>}
      </div>
    </>
  );

  const copy = (hidden: boolean) => (
    <ul className="flex" aria-hidden={hidden || undefined}>
      {brands.map((brand) => (
        <li key={brand.id}>
          {safeHref(brand.url) ? (
            <a
              href={safeHref(brand.url)}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={hidden ? -1 : undefined}
              className={cn('group', cell)}
            >
              {content(brand)}
            </a>
          ) : (
            <div className={cn('group', cell)}>{content(brand)}</div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <Container className="py-24 md:py-32">
      <SectionHeading eyebrow={dict.home.brands.eyebrow} title={dict.home.brands.title} />

      {/* Sonsuz kayan marka şeridi (hover'da durur). */}
      <div
        className="marquee mt-14 overflow-hidden"
        style={{ '--marquee-duration': `${Math.max(24, brands.length * 5)}s` } as CSSProperties}
      >
        <div className="marquee-track flex w-max will-change-transform">
          {copy(false)}
          {copy(true)}
        </div>
      </div>
    </Container>
  );
}

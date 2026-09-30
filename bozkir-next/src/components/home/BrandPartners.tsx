import { SmartImage as Image } from '@/components/ui/SmartImage';
import type { Brand } from '@/types/brand';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export async function BrandPartners({ brands, locale }: { brands: Brand[]; locale: Locale }) {
  const dict = dictFor(locale);
  return (
    <Container className="py-24 md:py-32">
      <SectionHeading eyebrow={dict.home.brands.eyebrow} title={dict.home.brands.title} />

      <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3 lg:grid-cols-5">
        {brands.map((brand) => {
          const content = (
            <>
              <Image
                src={brand.logo}
                alt={brand.name}
                width={brand.width ?? 140}
                height={brand.height ?? 56}
                className="h-12 w-auto object-contain opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
              />
              <div>
                <p className="text-sm font-medium">{brand.name}</p>
                {brand.category && (
                  <p className="mt-1 text-xs text-muted">
                    {locale === 'en' ? brand.categoryEn ?? brand.category : locale === 'ar' ? brand.categoryAr ?? brand.category : brand.category}
                  </p>
                )}
              </div>
            </>
          );

          const className =
            'group flex min-h-[180px] flex-col items-center justify-center gap-5 bg-surface p-8 text-center transition-colors hover:bg-surface-2';

          // URL yoksa bağlantı değil, düz kart olarak göster.
          return brand.url ? (
            <a key={brand.id} href={brand.url} target="_blank" rel="noopener noreferrer" className={className}>
              {content}
            </a>
          ) : (
            <div key={brand.id} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </Container>
  );
}

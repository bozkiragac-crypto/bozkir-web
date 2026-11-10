import type { ContentBlock } from '@/types/content';
import type { Brand } from '@/types/brand';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ChapterMark } from '@/components/ui/ChapterMark';
import { Testimonials } from '@/components/home/Testimonials';
import { BrandPartners } from '@/components/home/BrandPartners';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/**
 * Referanslar + yetkili markalar tek sahnede.
 * (Eski ayrı "Müşteri Referansları" ve "Markalar" bölümleri birleşti.)
 */
export async function SocialProof({
  testimonials,
  brands,
  locale,
}: {
  testimonials?: ContentBlock | null;
  brands: Brand[];
  locale: Locale;
}) {
  const hasTestimonials = (testimonials?.items.length ?? 0) > 0;
  if (!hasTestimonials && brands.length === 0) return null;

  const dict = await dictForRequest(locale);

  const title = hasTestimonials && testimonials?.title ? testimonials.title : dict.home.brands.title;
  const body = hasTestimonials ? testimonials?.body : undefined;

  return (
    <section id="referanslar" className="pad-compact border-y border-border bg-surface/40">
      <Container>
        <ChapterMark
          label={hasTestimonials ? dict.home.block.testimonials : dict.home.brands.eyebrow}
          className="mb-5"
        />
        <SectionHeading title={title} body={body} />
      </Container>

      {hasTestimonials && testimonials ? (
        <Testimonials block={testimonials} locale={locale} bare />
      ) : null}

      {brands.length > 0 ? <BrandPartners brands={brands} locale={locale} bare /> : null}
    </section>
  );
}

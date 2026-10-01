import { Plus } from 'lucide-react';
import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** SSS — JS'siz, erişilebilir yerleşik <details> ile + FAQPage schema. */
export async function FaqAccordion({ block, locale }: { block: ContentBlock; locale: Locale }) {
  if (block.items.length === 0) return null;
  const dict = dictFor(locale);

  return (
    <Container className="py-24 md:py-32">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeading eyebrow={block.subtitle || dict.home.block.faq} title={block.title} className="lg:border-0" />

        <div className="divide-y divide-border border-y border-border">
          {block.items.map((item) => (
            <details key={item.id} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left">
                <span className="text-base font-medium tracking-tight md:text-lg">{item.title}</span>
                <Plus className="h-5 w-5 flex-none text-muted transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <div className="pb-6 pe-10 text-sm leading-relaxed text-muted-strong">{item.description}</div>
            </details>
          ))}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: block.items.map((item) => ({
              '@type': 'Question',
              name: item.title,
              acceptedAnswer: { '@type': 'Answer', text: item.description },
            })),
          }),
        }}
      />
    </Container>
  );
}

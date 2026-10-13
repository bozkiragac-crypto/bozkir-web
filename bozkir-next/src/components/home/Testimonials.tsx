import { Quote } from 'lucide-react';
import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Panel } from '@/components/ui/Panel';
import { SmartImage as Image } from '@/components/ui/SmartImage';
import { Reveal } from '@/components/animations/Reveal';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Müşteri referansları — yalnızca admin içerik eklediğinde görünür. */
export async function Testimonials({ block, locale }: { block: ContentBlock; locale: Locale }) {
  const items = block.items;
  if (items.length === 0) return null;
  const dict = dictFor(locale);
  const h = dict.home.block;

  return (
    <Container className="py-24 md:py-32">
      <SectionHeading
        eyebrow={block.subtitle || h.testimonials}
        title={block.title}
        body={block.body}
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={(i % 3) * 0.06}>
            <Panel className="h-full gap-5 rounded-lg p-7">
              <Quote className="h-5 w-5 text-accent" />
              {item.description && (
                <p className="flex-1 leading-relaxed">&ldquo;{item.description}&rdquo;</p>
              )}
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                {item.imageUrl ? (
                  <span className="relative h-10 w-10 flex-none overflow-hidden rounded-full bg-surface-2">
                    <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                ) : null}
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.tag && <p className="text-xs text-muted">{item.tag}</p>}
                </div>
              </div>
            </Panel>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

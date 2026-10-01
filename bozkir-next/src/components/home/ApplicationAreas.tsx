import { SmartImage as Image } from '@/components/ui/SmartImage';
import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Panelin "işe dönüştüğü" uygulama alanları — büyük görsel + kısa metin. */
export async function ApplicationAreas({ block, locale }: { block: ContentBlock; locale: Locale }) {
  const items = block.items;
  if (items.length === 0) return null;
  const dict = dictFor(locale);
  const h = dict.home.block;

  return (
    <Container className="py-24 md:py-32">
      <SectionHeading eyebrow={block.subtitle || h.applications} title={block.title} body={block.body} />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.05}>
            <article className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs tracking-[0.14em] text-muted uppercase">
                    {h.imageSoon}
                  </div>
                )}
              </div>
              <h3 className="mt-5 text-lg font-medium tracking-tight">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm leading-relaxed text-muted-strong">{item.description}</p>}
            </article>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

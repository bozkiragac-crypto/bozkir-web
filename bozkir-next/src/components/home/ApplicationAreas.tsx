import { SmartImage as Image } from '@/components/ui/SmartImage';
import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Panelin "işe dönüştüğü" uygulama alanları — büyük görsel + kısa metin. */
export async function ApplicationAreas({
  block,
  locale,
  bare = false,
}: {
  block: ContentBlock;
  locale: Locale;
  bare?: boolean;
}) {
  const items = block.items;
  if (items.length === 0) return null;
  const dict = await dictForRequest(locale);
  const h = dict.home.block;

  const grid = (
    <div
      className={
        bare
          ? 'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-6'
          : 'mt-12 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-6'
      }
    >
      {items.map((item, i) => (
        <Reveal key={item.id} delay={i * 0.05}>
          <article className="group">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2 md:aspect-square">
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
            <h3 className="mt-3 text-sm font-medium tracking-tight md:mt-5 md:text-lg">{item.title}</h3>
            {item.description && (
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-strong md:mt-2 md:text-sm">
                {item.description}
              </p>
            )}
          </article>
        </Reveal>
      ))}
    </div>
  );

  if (bare) return grid;

  return (
    <Container className="pad-band">
      <SectionHeading eyebrow={block.subtitle || h.applications} title={block.title} body={block.body} />
      {grid}
    </Container>
  );
}

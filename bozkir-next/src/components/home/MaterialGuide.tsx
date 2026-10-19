import { ArrowUpRight } from 'lucide-react';
import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { Panel, PanelGrid, PanelLink } from '@/components/ui/Panel';
import { safeHref } from '@/lib/safe-url';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** "Hangi iş için hangi panel?" — niteliksel karşılaştırma kartları. */
export async function MaterialGuide({ block, locale }: { block: ContentBlock; locale: Locale }) {
  if (block.items.length === 0) return null;
  const dict = dictFor(locale);
  const h = dict.home.block;

  return (
    <Container id="rehber" className="py-24 md:py-32">
      <SectionHeading eyebrow={block.subtitle || h.guide} title={block.title} body={block.body} />

      <Reveal className="mt-12">
        <PanelGrid className="sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => {
            const link = safeHref(item.linkUrl);
            const inner = (
              <>
                {item.tag && (
                  <span className="inline-flex w-fit rounded-full border border-border px-3 py-1 text-[0.65rem] tracking-[0.14em] text-muted-strong uppercase">
                    {item.tag}
                  </span>
                )}
                <h3 className="mt-5 text-xl font-medium tracking-tight">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-strong">
                  {item.description}
                </p>
                {link && (
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                    {h.collectionCta} <ArrowUpRight className="h-4 w-4" />
                  </span>
                )}
              </>
            );

            return link ? (
              <PanelLink
                key={item.id}
                href={link}
                className="group p-8 transition-colors hover:bg-surface-2"
              >
                {inner}
              </PanelLink>
            ) : (
              <Panel key={item.id} className="p-8">
                {inner}
              </Panel>
            );
          })}
        </PanelGrid>
      </Reveal>
    </Container>
  );
}

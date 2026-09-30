import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { ArrowUpRight } from 'lucide-react';
import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** "Hangi iş için hangi panel?" — niteliksel karşılaştırma kartları. */
export async function MaterialGuide({ block, locale }: { block: ContentBlock; locale: Locale }) {
  if (block.items.length === 0) return null;
  const dict = dictFor(locale);
  const h = dict.home.block;

  return (
    <Container className="py-24 md:py-32">
      <SectionHeading eyebrow={block.subtitle || h.guide} title={block.title} body={block.body} />

      <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {block.items.map((item) => {
          const inner = (
            <>
              {item.tag && (
                <span className="inline-flex w-fit rounded-full border border-border px-3 py-1 text-[0.65rem] tracking-[0.14em] text-muted-strong uppercase">
                  {item.tag}
                </span>
              )}
              <h3 className="mt-5 text-xl font-medium tracking-tight">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-strong">{item.description}</p>
              {item.linkUrl && (
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
                  {h.collectionCta} <ArrowUpRight className="h-4 w-4" />
                </span>
              )}
            </>
          );

          return item.linkUrl ? (
            <Link key={item.id} href={item.linkUrl} className="group flex flex-col bg-surface p-8 transition-colors hover:bg-surface-2">
              {inner}
            </Link>
          ) : (
            <div key={item.id} className="flex flex-col bg-surface p-8">
              {inner}
            </div>
          );
        })}
      </div>
    </Container>
  );
}

import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Talepten teslimata 4 adım. */
export async function ProcessSteps({ block, locale }: { block: ContentBlock; locale: Locale }) {
  if (block.items.length === 0) return null;
  const dict = dictFor(locale);

  return (
    <section data-on-dark className="bg-foreground py-24 text-background md:py-32">
      <Container>
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-eyebrow text-background/60">{block.subtitle || dict.home.block.process}</p>
            <h2 className="text-headline mt-4">{block.title}</h2>
            {block.body && <p className="mt-5 leading-relaxed text-background/70">{block.body}</p>}
          </div>
        </Reveal>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((item, i) => (
            <li key={item.id} className="border-t border-background/20 pt-6">
              <span className="numerals block text-4xl font-medium tracking-tight text-background/40">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-lg font-medium tracking-tight">{item.title}</h3>
              {item.description && <p className="mt-3 text-sm leading-relaxed text-background/70">{item.description}</p>}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

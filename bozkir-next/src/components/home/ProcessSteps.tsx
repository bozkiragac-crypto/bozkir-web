import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { STAGGER } from '@/lib/motion';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Talepten teslimata 4 adım. */
export async function ProcessSteps({ block, locale }: { block: ContentBlock; locale: Locale }) {
  if (block.items.length === 0) return null;
  const dict = await dictForRequest(locale);

  return (
    <section
      id="surec"
      data-on-dark
      className="relative isolate overflow-hidden bg-foreground py-24 text-background md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(120%_80%_at_12%_0%,rgba(179,169,143,0.12),transparent_58%)]"
      />
      <Container className="relative">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-eyebrow text-background/60">
              {block.subtitle || dict.home.block.process}
            </p>
            <h2 className="text-headline mt-4">{block.title}</h2>
            {block.body && <p className="mt-5 leading-relaxed text-background/70">{block.body}</p>}
          </div>
        </Reveal>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.id}
              delay={(i % 4) * STAGGER.list}
              className="border-t border-background/20 pt-6"
            >
              <span className="numerals block text-4xl font-medium tracking-tight text-background/40">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-lg font-medium tracking-tight">{item.title}</h3>
              {item.description && (
                <p className="mt-3 text-sm leading-relaxed text-background/70">
                  {item.description}
                </p>
              )}
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Editoryal manifesto bandı — bölüm ritmini kırar. */
export async function Manifesto({ locale }: { locale: Locale }) {
  const dict = dictFor(locale);
  return (
    <section className="border-y border-border bg-surface">
      <Container className="py-28 md:py-40">
        <Reveal>
          <p className="text-eyebrow">{dict.home.manifesto.eyebrow}</p>
          <p className="text-editorial mt-10 max-w-4xl text-[clamp(1.7rem,4.6vw,3.6rem)] leading-[1.14]">
            {dict.home.manifesto.quote}
          </p>
          <p className="mt-10 text-caption">{dict.home.manifesto.signature}</p>
        </Reveal>
      </Container>
    </section>
  );
}

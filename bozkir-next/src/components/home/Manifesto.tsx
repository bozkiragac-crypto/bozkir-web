import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Editoryal manifesto bandı — bölüm ritmini kırar. */
export async function Manifesto({ locale }: { locale: Locale }) {
  const dict = await dictForRequest(locale);
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(90%_70%_at_85%_8%,rgba(141,132,116,0.10),transparent_60%)]"
      />
      <span
        aria-hidden
        className="font-display pointer-events-none absolute top-4 start-1 select-none text-[clamp(4.5rem,16vw,18rem)] leading-none text-foreground/[0.05] md:-top-6 md:start-8 md:text-[clamp(8rem,22vw,18rem)]"
      >
        &ldquo;
      </span>
      <Container className="relative py-28 md:py-40">
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

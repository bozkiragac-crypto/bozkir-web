import { Container } from '@/components/ui/Container';
import { ChapterMark } from '@/components/ui/ChapterMark';
import { Manifesto } from '@/components/home/Manifesto';
import { StatsBand } from '@/components/home/StatsBand';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/**
 * Manifesto + doğrulanabilir sayılar tek sahnede.
 * (Eski ayrı "StatsBand" bölümü buraya taşındı.)
 */
export async function ManifestoStats({
  locale,
  stats,
}: {
  locale: Locale;
  stats?: { value: string; label: string }[];
}) {
  const dict = await dictForRequest(locale);

  return (
    <section id="manifesto" className="relative overflow-hidden border-y border-border bg-surface">
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

      <Container className="pad-compact relative">
        <ChapterMark label={dict.home.manifesto.eyebrow} className="mb-10" />
        <Manifesto locale={locale} bare />
      </Container>

      <Container className="relative pb-12 md:pb-16">
        <StatsBand stats={stats} />
      </Container>
    </section>
  );
}

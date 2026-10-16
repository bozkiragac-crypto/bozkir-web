import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { Panel3D } from '@/components/three/Panel3D';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export async function Material3D({ locale }: { locale: Locale }) {
  const dict = dictFor(locale);
  const h = dict.home.material3d;
  return (
    <Container className="py-24 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="text-eyebrow">{h.eyebrow}</p>
          <h2 className="text-headline mt-4">{h.title}</h2>
          <p className="mt-6 max-w-lg leading-relaxed text-muted-strong">{h.body}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-[color:var(--color-accent-soft)]/12 blur-2xl"
            />
            <div className="h-[380px] overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2 shadow-[var(--card-shadow)] sm:h-[480px] lg:h-[560px]">
              <Panel3D />
            </div>
          </div>
        </Reveal>
      </div>
    </Container>
  );
}

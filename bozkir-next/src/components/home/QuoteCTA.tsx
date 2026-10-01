import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export async function QuoteCTA({ locale }: { locale: Locale }) {
  const s = await getSiteSettings();
  const dict = dictFor(locale);
  const h = dict.home.quoteCta;
  return (
    <Container className="pb-24 md:pb-32">
      <div data-on-dark className="relative overflow-hidden rounded-xl bg-foreground px-8 py-16 text-background md:px-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-headline">{h.title}</h2>
          <p className="mt-5 max-w-lg text-background/70">{h.body}</p>
          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <MagneticButton className="[&>a]:w-full sm:[&>a]:w-auto">
              <ButtonLink href="/teklif-al" size="lg" className="w-full justify-center bg-background text-foreground hover:bg-white sm:w-auto">
                {h.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
              </ButtonLink>
            </MagneticButton>
            <TrackedLink
              href={telHref(s.phone)}
              event="phone_click"
              source="quote_cta"
              className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-background/30 px-7 text-[0.95rem] font-medium tracking-tight text-background transition-[transform,background-color,color,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-background hover:bg-background hover:text-foreground active:scale-[0.985] sm:w-auto"
            >
              <Phone className="h-4 w-4" /> {s.phone}
            </TrackedLink>
            <TrackedLink
              href={s.whatsapp}
              event="whatsapp_click"
              source="quote_cta"
              className="inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-background/80 transition-colors hover:text-background sm:py-0"
            >
              <MessageCircle className="h-4 w-4" /> {h.whatsapp}
            </TrackedLink>
          </div>
        </div>
      </div>
    </Container>
  );
}

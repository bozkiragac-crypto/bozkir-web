import { Phone, MessageCircle, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

export async function QuoteCTA({ locale }: { locale: Locale }) {
  const s = await getSiteSettings();
  const dict = dictFor(locale);
  const h = dict.home.quoteCta;
  return (
    <Container className="pb-24 md:pb-32">
      <div className="relative overflow-hidden rounded-xl bg-foreground px-8 py-16 text-background md:px-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-headline">{h.title}</h2>
          <p className="mt-5 max-w-lg text-background/70">{h.body}</p>
          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <MagneticButton className="[&>a]:w-full sm:[&>a]:w-auto">
              <ButtonLink href="/teklif-al" size="lg" className="w-full justify-center bg-background text-foreground hover:bg-white sm:w-auto">
                {h.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </ButtonLink>
            </MagneticButton>
            <ButtonLink
              href={telHref(s.phone)}
              size="lg"
              variant="outline"
              className="w-full justify-center border-background/30 text-background hover:border-background hover:bg-background hover:text-foreground sm:w-auto"
            >
              <Phone className="h-4 w-4" /> {s.phone}
            </ButtonLink>
            <a
              href={s.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-background/80 transition-colors hover:text-background sm:py-0"
            >
              <MessageCircle className="h-4 w-4" /> {h.whatsapp}
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}

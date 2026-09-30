import { Boxes, Truck, Warehouse, CreditCard, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { siteConfig } from '@/config/site';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

const icons = [Boxes, Truck, Warehouse, CreditCard];

export async function SupplyLogistics({ locale }: { locale: Locale }) {
  const dict = dictFor(locale);
  const h = dict.home.supply;
  const [contactBefore, contactAfter] = h.contactNote.split('{phone}');
  return (
    <Container className="py-24 md:py-32">
      <SectionHeading
        eyebrow={h.eyebrow}
        title={h.title}
        action={
          <MagneticButton>
            <ButtonLink href="/teklif-al" variant="outline">
              {h.cta} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </MagneticButton>
        }
      />

      <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {h.items.map((item, i) => {
          const Icon = icons[i] ?? Boxes;
          return (
            <div key={item.title} className="bg-surface p-7 md:p-8">
              <Icon className="h-5 w-5 text-accent" />
              <h3 className="mt-6 text-lg font-medium tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-strong">{item.text}</p>
            </div>
          );
        })}
      </div>

      <Reveal>
        <p className="mt-8 text-sm text-muted">
          {contactBefore}
          <a href={siteConfig.phoneHref} className="text-foreground underline underline-offset-4">
            {siteConfig.phone}
          </a>
          {contactAfter}
        </p>
      </Reveal>
    </Container>
  );
}

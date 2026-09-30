import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle, Navigation, ExternalLink } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pickLocaleText } from '@/lib/data/catalog';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  return buildMetadata({
    title: dict.pages.contact.metaTitle,
    description: dict.pages.contact.metaDescription,
    path: '/iletisim',
    image: '/images/hero-showroom.jpeg',
    locale: lang,
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const c = dict.pages.contact;
  const s = await getSiteSettings();
  const hours = pickLocaleText(s.hours, lang, s.hoursEn, s.hoursAr);
  const depotCoords = s.warehouse.coords;

  const items = [
    { icon: Phone, label: c.phone, value: s.phone, href: telHref(s.phone) },
    { icon: Phone, label: c.warehouse, value: s.phone2, href: s.phone2 ? telHref(s.phone2) : undefined },
    { icon: MessageCircle, label: c.whatsapp, value: c.whatsappValue, href: s.whatsapp },
    { icon: Mail, label: c.email, value: s.email, href: `mailto:${s.email}` },
    {
      icon: MapPin,
      label: c.address,
      value: `${s.address.street}, ${s.address.postalCode} ${s.address.locality} / ${s.address.region}`,
      href: undefined,
    },
    { icon: Clock, label: c.hours, value: hours, href: undefined },
  ];

  return (
    <>
      <BreadcrumbScript locale={lang} items={[{ name: c.crumbHome, path: '/' }, { name: c.crumb, path: '/iletisim' }]} />
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle}
        description={c.heroDescription}
        crumbs={[
          { label: c.crumbHome, href: '/' },
          { label: c.crumb },
        ]}
      />

      <Container className="pb-24 md:pb-32">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="h-5 w-5 text-muted-strong" />
                <p className="mt-4 text-xs tracking-[0.14em] text-muted uppercase">{item.label}</p>
                <p className="mt-2 break-words text-base font-medium">{item.value}</p>
              </>
            );
            return item.href ? (
              <a key={item.label} href={item.href} className="bg-surface p-7 transition-colors hover:bg-surface-2">
                {content}
              </a>
            ) : (
              <div key={item.label} className="bg-surface p-7">
                {content}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/teklif-al" size="lg" className="w-full justify-center sm:w-auto">
            {c.ctaQuote}
          </ButtonLink>
          <ButtonLink href={s.whatsapp} size="lg" variant="outline" className="w-full justify-center sm:w-auto">
            {c.ctaWhatsapp}
          </ButtonLink>
        </div>

        <div className="mt-16 overflow-hidden rounded-lg border border-border">
          <iframe
            title={c.mapTitle}
            src="https://www.google.com/maps?q=G%C3%BCzelbur%C3%A7%20Mah%20Yunus%20Emre%20Cad%20No:10%2FC%20Antakya%20Hatay&output=embed"
            className="h-[320px] w-full sm:h-[420px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {depotCoords && (
          <section className="mt-20">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-8 md:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[color:var(--color-accent-soft)]/20 blur-3xl"
                />
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <p className="text-eyebrow mt-6">{c.depotTitle}</p>
                  <h2 className="text-headline mt-3 text-3xl md:text-4xl">{c.depotTitle}</h2>
                  <p className="mt-4 max-w-md leading-relaxed text-muted-strong">{c.depotDescription}</p>
                  {s.warehouse.address && (
                    <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-muted-strong">
                      <MapPin className="mt-0.5 h-4 w-4 flex-none" />
                      {s.warehouse.address}
                    </p>
                  )}
                </div>

                <div className="relative mt-8 border-t border-border pt-6">
                  <p className="text-[0.65rem] tracking-[0.14em] text-muted uppercase">{c.coordinates}</p>
                  <p className="numerals mt-1 text-sm font-medium">{depotCoords}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(depotCoords)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                      <Navigation className="h-4 w-4" /> {c.directions}
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(depotCoords)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-surface-2"
                    >
                      <ExternalLink className="h-4 w-4" /> {c.openInMaps}
                    </a>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border">
                <iframe
                  title={c.depotMapTitle}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(depotCoords)}&output=embed`}
                  className="h-[320px] w-full lg:h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>
        )}
      </Container>
    </>
  );
}

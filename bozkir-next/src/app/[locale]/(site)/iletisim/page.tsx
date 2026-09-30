import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
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
          <div className="mt-16">
            <p className="text-eyebrow">{c.depotTitle}</p>
            <div className="mt-5 grid gap-6 md:grid-cols-[1fr_2fr]">
              <div className="rounded-lg border border-border bg-surface p-7">
                <MapPin className="h-5 w-5 text-muted-strong" />
                {s.warehouse.address && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-strong">{s.warehouse.address}</p>
                )}
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(depotCoords)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-medium text-foreground underline underline-offset-4"
                >
                  {depotCoords}
                </a>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  title={c.depotMapTitle}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(depotCoords)}&output=embed`}
                  className="h-[320px] w-full sm:h-[420px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

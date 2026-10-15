import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle, Navigation, ExternalLink } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pickLocaleText } from '@/lib/data/catalog';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';
import { cn } from '@/lib/utils';

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

/** Bir konum bölümü: numaralı başlık + adres/koordinat + zengin harita. */
function LocationSection({
  id,
  index,
  eyebrow,
  title,
  description,
  address,
  coords,
  mapTitle,
  labels,
  reverse = false,
}: {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  description?: string;
  address?: string;
  coords: string;
  mapTitle: string;
  labels: { coordinates: string; directions: string; openInMaps: string };
  reverse?: boolean;
}) {
  if (!coords) return null;
  return (
    <section id={id} className="mt-16 md:mt-24">
      <div
        className={cn(
          'grid items-center gap-8 lg:grid-cols-2 lg:gap-12',
          reverse && 'lg:[&>*:first-child]:order-2',
        )}
      >
        <div className="relative">
          <div className="flex items-center gap-4">
            <span className="numerals text-xs tracking-[0.2em] text-muted">
              {String(index).padStart(2, '0')}
            </span>
            <span className="h-px w-10 bg-border" aria-hidden />
            <span className="text-eyebrow">{eyebrow}</span>
          </div>

          <h2 className="text-headline mt-5 text-3xl md:text-4xl">{title}</h2>
          {description && (
            <p className="mt-4 max-w-md leading-relaxed text-muted-strong">{description}</p>
          )}
          {address && (
            <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-muted-strong">
              <MapPin className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
              {address}
            </p>
          )}

          <div className="mt-7 inline-flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.5)]">
            <div>
              <p className="text-[0.65rem] tracking-[0.14em] text-muted uppercase">
                {labels.coordinates}
              </p>
              <p className="numerals mt-0.5 text-sm font-medium">{coords}</p>
            </div>
            <span className="mx-1 hidden h-9 w-px bg-border sm:block" aria-hidden />
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coords)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Navigation className="h-4 w-4" aria-hidden /> {labels.directions}
              </a>
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(coords)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <ExternalLink className="h-4 w-4" aria-hidden /> {labels.openInMaps}
              </a>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border shadow-[var(--card-shadow)]">
          <iframe
            title={mapTitle}
            src={`https://www.google.com/maps?q=${encodeURIComponent(coords)}&output=embed`}
            className="h-[320px] w-full sm:h-[400px] lg:h-[460px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const c = dict.pages.contact;
  const s = await getSiteSettings();
  const hours = pickLocaleText(s.hours, lang, s.hoursEn, s.hoursAr);
  const officeCoords = s.address.coords.trim();
  const depotCoords = s.warehouse.coords.trim();
  const officeAddress = `${s.address.street}, ${s.address.postalCode} ${s.address.locality} / ${s.address.region}`;
  const mapLabels = {
    coordinates: c.coordinates,
    directions: c.directions,
    openInMaps: c.openInMaps,
  };

  const items = [
    { icon: Phone, label: c.phone, value: s.phone, href: telHref(s.phone) },
    {
      icon: Phone,
      label: c.warehouse,
      value: s.phone2,
      href: s.phone2 ? telHref(s.phone2) : undefined,
    },
    { icon: MessageCircle, label: c.whatsapp, value: c.whatsappValue, href: s.whatsapp },
    { icon: Mail, label: c.email, value: s.email, href: `mailto:${s.email}` },
    {
      icon: MapPin,
      label: c.address,
      value: officeAddress,
      href: undefined,
    },
    { icon: Clock, label: c.hours, value: hours, href: undefined },
  ];

  return (
    <>
      <BreadcrumbScript
        locale={lang}
        items={[
          { name: c.crumbHome, path: '/' },
          { name: c.crumb, path: '/iletisim' },
        ]}
      />
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle}
        description={c.heroDescription}
        crumbs={[{ label: c.crumbHome, href: '/' }, { label: c.crumb }]}
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
              item.href.startsWith('tel:') || item.href.includes('wa.me') ? (
                <TrackedLink
                  key={item.label}
                  href={item.href}
                  event={item.href.startsWith('tel:') ? 'phone_click' : 'whatsapp_click'}
                  source="contact_info"
                  className="bg-surface p-7 transition-colors hover:bg-surface-2"
                >
                  {content}
                </TrackedLink>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="bg-surface p-7 transition-colors hover:bg-surface-2"
                >
                  {content}
                </a>
              )
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
          <TrackedLink
            href={s.whatsapp}
            event="whatsapp_click"
            source="contact_cta"
            className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-border-strong px-7 text-[0.95rem] font-medium tracking-tight text-foreground transition-[transform,background-color,color,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-foreground hover:text-background active:scale-[0.985] sm:w-auto"
          >
            {c.ctaWhatsapp}
          </TrackedLink>
        </div>

        <LocationSection
          id="is-yeri"
          index={1}
          eyebrow={c.address}
          title={c.officeTitle}
          description={c.officeDescription}
          address={officeAddress}
          coords={officeCoords}
          mapTitle={c.officeMapTitle}
          labels={mapLabels}
        />

        <LocationSection
          id="depo"
          index={2}
          reverse
          eyebrow={c.warehouse}
          title={c.depotTitle}
          description={c.depotDescription}
          address={s.warehouse.address}
          coords={depotCoords}
          mapTitle={c.depotMapTitle}
          labels={mapLabels}
        />
      </Container>
    </>
  );
}

import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, Navigation, ExternalLink } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { buildMetadata } from '@/lib/seo';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { resolveWhatsAppTemplate, whatsappHref } from '@/lib/whatsapp';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { Reveal } from '@/components/animations/Reveal';
import { CopyButton } from '@/components/contact/CopyButton';
import { OpenStatus } from '@/components/contact/OpenStatus';
import { isLocale } from '@/i18n/config';
import { dictForRequest } from '@/i18n/server';
import { pickLocaleText } from '@/lib/data/catalog';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = await dictForRequest(lang);
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
  labels: {
    coordinates: string;
    directions: string;
    openInMaps: string;
    copy: string;
    copied: string;
  };
  reverse?: boolean;
}) {
  if (!coords) return null;
  return (
    <section id={id} className="mt-16 md:mt-24">
      <Reveal>
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
              <div className="mt-5 flex flex-wrap items-start gap-3">
                <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-strong">
                  <MapPin className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
                  {address}
                </p>
                <CopyButton value={address} label={labels.copy} copiedLabel={labels.copied} />
              </div>
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
            <span className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {eyebrow}
            </span>
            <iframe
              title={mapTitle}
              src={`https://www.google.com/maps?q=${encodeURIComponent(coords)}&output=embed`}
              className="h-[320px] w-full sm:h-[400px] lg:h-[460px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = await dictForRequest(lang);
  const c = dict.pages.contact;
  const s = await getSiteSettings();
  const hours = pickLocaleText(s.hours, lang, s.hoursEn, s.hoursAr);
  const timeZone = process.env.APP_TIME_ZONE || 'Europe/Istanbul';
  const officeCoords = s.address.coords.trim();
  const depotCoords = s.warehouse.coords.trim();
  const officeAddress = `${s.address.street}, ${s.address.postalCode} ${s.address.locality} / ${s.address.region}`;
  const whatsappMessage = resolveWhatsAppTemplate(s.whatsappMessages, lang, 'general');
  const whatsappLink =
    whatsappHref(s.whatsapp || s.phone, whatsappMessage, s.phone) || s.whatsapp;
  const mapLabels = {
    coordinates: c.coordinates,
    directions: c.directions,
    openInMaps: c.openInMaps,
    copy: c.copy,
    copied: c.copied,
  };

  const items = [
    { icon: Phone, label: c.phone, value: s.phone, href: telHref(s.phone), copy: s.phone },
    {
      icon: Phone,
      label: c.warehouse,
      value: s.phone2,
      href: s.phone2 ? telHref(s.phone2) : undefined,
      copy: s.phone2,
    },
    {
      icon: WhatsAppIcon,
      label: c.whatsapp,
      value: c.whatsappValue,
      href: whatsappLink,
      copy: whatsappLink,
    },
    { icon: Mail, label: c.email, value: s.email, href: `mailto:${s.email}`, copy: s.email },
    { icon: MapPin, label: c.address, value: officeAddress, href: undefined, copy: '' },
    { icon: Clock, label: c.hours, value: hours, href: undefined, copy: '' },
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
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-[80%] -translate-x-1/2 rounded-full bg-[color:var(--color-accent-soft)]/15 blur-3xl"
          />
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="group relative bg-surface p-7 transition-colors hover:bg-surface-2/60"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-xs tracking-[0.14em] text-muted uppercase">
                    {item.label}
                  </p>
                  {item.href ? (
                    item.href.startsWith('tel:') || item.href.includes('wa.me') ? (
                      <TrackedLink
                        href={item.href}
                        event={item.href.startsWith('tel:') ? 'phone_click' : 'whatsapp_click'}
                        source="contact_info"
                        className="mt-2 block break-words text-base font-medium hover:underline"
                      >
                        {item.value}
                      </TrackedLink>
                    ) : (
                      <a
                        href={item.href}
                        className="mt-2 block break-words text-base font-medium hover:underline"
                      >
                        {item.value}
                      </a>
                    )
                  ) : (
                    <p className="mt-2 break-words text-base font-medium">{item.value}</p>
                  )}
                  {idx === 5 ? (
                    <OpenStatus
                      schedule={s.openHours}
                      timeZone={timeZone}
                      openLabel={c.openNow}
                      closedLabel={c.closedNow}
                      className="mt-3"
                    />
                  ) : item.copy ? (
                    <CopyButton
                      value={item.copy}
                      label={c.copy}
                      copiedLabel={c.copied}
                      className="mt-3"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/teklif-al" size="lg" className="w-full justify-center sm:w-auto">
            {c.ctaQuote}
          </ButtonLink>
          <TrackedLink
            href={whatsappLink}
            event="whatsapp_click"
            source="contact_cta"
            className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-border-strong px-7 text-[0.95rem] font-medium tracking-tight text-foreground transition-[transform,background-color,color,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-foreground hover:text-background active:scale-[0.985] sm:w-auto"
          >
            {c.ctaWhatsapp}
          </TrackedLink>
        </div>

        <SectionHeading title={c.locationsTitle} className="mt-20" />

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

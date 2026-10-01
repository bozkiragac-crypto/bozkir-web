'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { Instagram, Facebook, MessageCircle, ChevronDown, Clock } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import type { SiteSettings } from '@/lib/data/settings';
import { telHref } from '@/lib/phone';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { track } from '@/lib/analytics';
import type { Category } from '@/types/category';

const corporateLinkKeys = [
  { key: 'nav.about', href: '/hakkimizda' },
  { key: 'nav.dealers', href: '/bayilikler' },
  { key: 'nav.catalogs', href: '/katalog' },
  { key: 'nav.faq', href: '/sss' },
  { key: 'nav.contact', href: '/iletisim' },
  { key: 'nav.quote', href: '/teklif-al' },
];

function Social({ s }: { s: SiteSettings }) {
  const item = 'inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-strong transition-colors hover:bg-surface-2 hover:text-foreground';
  return (
    <div className="flex items-center gap-1">
      <a href={s.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={item}>
        <Instagram className="h-5 w-5" />
      </a>
      <a href={s.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={item}>
        <Facebook className="h-5 w-5" />
      </a>
      <a
        href={s.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        onClick={() => track('whatsapp_click', { source: 'footer' })}
        className={item}
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
}

function Brand({ s }: { s: SiteSettings }) {
  const { t } = useDictionary();
  return (
    <div>
      <p className="text-sm font-semibold tracking-[0.16em] uppercase">{t('footer.madeIn')}</p>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-strong">{t('footer.tagline')}</p>
      <Social s={s} />
    </div>
  );
}

function Contact({ s }: { s: SiteSettings }) {
  const { locale } = useDictionary();
  const hours = locale === 'en' ? s.hoursEn : locale === 'ar' ? s.hoursAr : s.hours;
  return (
    <ul className="space-y-3 text-sm text-muted-strong">
      <li>
        <a
          href={telHref(s.phone)}
          onClick={() => track('phone_click', { source: 'footer' })}
          className="link-underline transition-colors hover:text-foreground"
        >
          {s.phone}
        </a>
      </li>
      <li>
        <a href={`mailto:${s.email}`} className="link-underline transition-colors hover:text-foreground">
          {s.email}
        </a>
      </li>
      <li>{s.address.street}</li>
      <li>
        {s.address.postalCode} {s.address.locality} / {s.address.region}
      </li>
      {hours && (
        <li className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 flex-none text-muted" />
          <span>{hours}</span>
        </li>
      )}
    </ul>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4">
        <span className="text-eyebrow">{title}</span>
        <ChevronDown className="h-4 w-4 text-muted transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

export function Footer({ s, categories = [] }: { s: SiteSettings; categories?: Category[] }) {
  const { t } = useDictionary();

  const productLinks = categories.slice(0, 7).map((c) => ({
    label: c.name,
    href: `/kategoriler/${c.slug}`,
  }));

  const columns = [
    { title: t('footer.productsColumn'), links: productLinks },
    { title: t('footer.corporateColumn'), links: corporateLinkKeys.map((l) => ({ label: t(l.key), href: l.href })) },
  ];

  return (
    <footer className="border-t border-border bg-surface pb-[var(--safe-bottom)]">
      <Container className="border-b border-border py-10 md:py-20">
        <p className="font-display text-[clamp(1.6rem,8vw,7rem)] leading-[0.95] tracking-[-0.03em]">
          {t('footer.madeIn')}
        </p>
        <p className="mt-4 max-w-md text-sm text-muted-strong md:mt-6">{t('footer.tagline')}</p>
      </Container>

      <Container className="py-10 md:py-20">
        {/* Masaüstü: 4 sütun */}
        <div className="hidden gap-12 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <Brand s={s} />
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-eyebrow">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-underline text-sm text-muted-strong transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="text-eyebrow">{t('footer.contact')}</p>
            <div className="mt-5">
              <Contact s={s} />
            </div>
          </div>
        </div>

        {/* Mobil: akordeon */}
        <div className="md:hidden">
          <Brand s={s} />
          <div className="mt-6">
            {columns.map((col) => (
              <Accordion key={col.title} title={col.title}>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-muted-strong">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Accordion>
            ))}
            <Accordion title={t('footer.contact')}>
              <Contact s={s} />
            </Accordion>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted md:mt-16 md:flex-row md:items-center md:justify-between md:pt-8">
          <p>
            © {new Date().getFullYear()} {t('footer.madeIn')}. {t('footer.rights')}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/kvkk" className="link-underline transition-colors hover:text-foreground">
              {t('footer.kvkk')}
            </Link>
            <Link href="/gizlilik" className="link-underline transition-colors hover:text-foreground">
              {t('footer.privacy')}
            </Link>
            <Link href="/cerez-politikasi" className="link-underline transition-colors hover:text-foreground">
              {t('footer.cookies')}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

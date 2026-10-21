import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';
import { getSiteSettings } from '@/lib/data/settings';
import { isLocale } from '@/i18n/config';
import { dictForRequest } from '@/i18n/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = await dictForRequest(lang);
  return buildMetadata({
    title: dict.pages.kvkk.metaTitle,
    description: dict.pages.kvkk.metaDescription,
    path: '/kvkk',
    locale: lang,
  });
}

export default async function KvkkPage({ params }: PageProps) {
  await headers();
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const [dict, settings] = await Promise.all([dictForRequest(lang), getSiteSettings()]);
  const k = dict.pages.kvkk;

  const address = `${settings.address.street}, ${settings.address.postalCode} ${settings.address.locality} / ${settings.address.region}`;
  const fill = (text: string) =>
    text
      .replace('{name}', settings.identity.legalName)
      .replace('{address}', address)
      .replace('{email}', settings.email);

  const custom = settings.kvkkText.trim();
  if (custom) {
    const paragraphs = custom
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <LegalPage title={k.title} updated="2026" locale={lang}>
        <LegalSection title={k.title}>
          {paragraphs.map((p, i) => (
            <p key={i}>{fill(p)}</p>
          ))}
        </LegalSection>
      </LegalPage>
    );
  }

  return (
    <LegalPage title={k.title} updated="2026" locale={lang}>
      {k.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.body.map((p, i) => (
            <p key={i}>{fill(p)}</p>
          ))}
        </LegalSection>
      ))}
    </LegalPage>
  );
}

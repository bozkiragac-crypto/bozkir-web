import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';
import { siteConfig } from '@/config/site';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  return buildMetadata({
    title: dict.pages.kvkk.metaTitle,
    description: dict.pages.kvkk.metaDescription,
    path: '/kvkk',
    noIndex: true,
    locale: lang,
  });
}

export default async function KvkkPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const k = dict.pages.kvkk;

  const address = `${siteConfig.address.street}, ${siteConfig.address.postalCode} ${siteConfig.address.locality} / ${siteConfig.address.region}`;
  const fill = (text: string) =>
    text.replace('{name}', siteConfig.legalName).replace('{address}', address).replace('{email}', siteConfig.email);

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

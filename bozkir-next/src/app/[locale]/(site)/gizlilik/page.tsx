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
    title: dict.pages.privacy.metaTitle,
    description: dict.pages.privacy.metaDescription,
    path: '/gizlilik',
    locale: lang,
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const p = dict.pages.privacy;

  const fill = (text: string) => text.replace('{name}', siteConfig.legalName).replace('{email}', siteConfig.email);

  return (
    <LegalPage title={p.title} updated="2026" locale={lang}>
      {p.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.body.map((para, i) => (
            <p key={i}>{fill(para)}</p>
          ))}
        </LegalSection>
      ))}
    </LegalPage>
  );
}

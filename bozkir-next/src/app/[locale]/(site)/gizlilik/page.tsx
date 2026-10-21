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
    title: dict.pages.privacy.metaTitle,
    description: dict.pages.privacy.metaDescription,
    path: '/gizlilik',
    locale: lang,
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  await headers();
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const [dict, settings] = await Promise.all([dictForRequest(lang), getSiteSettings()]);
  const p = dict.pages.privacy;

  const fill = (text: string) =>
    text.replace('{name}', settings.identity.legalName).replace('{email}', settings.email);

  const custom = settings.privacyText.trim();
  if (custom) {
    const paragraphs = custom
      .split(/\n\s*\n/)
      .map((para) => para.trim())
      .filter(Boolean);
    return (
      <LegalPage title={p.title} updated="2026" locale={lang}>
        <LegalSection title={p.title}>
          {paragraphs.map((para, i) => (
            <p key={i}>{fill(para)}</p>
          ))}
        </LegalSection>
      </LegalPage>
    );
  }

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

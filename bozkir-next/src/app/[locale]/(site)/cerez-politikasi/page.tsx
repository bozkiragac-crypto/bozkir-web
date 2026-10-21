import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';
import { isLocale } from '@/i18n/config';
import { dictForRequest } from '@/i18n/server';
import { getSiteSettingsFresh } from '@/lib/data/settings';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = await dictForRequest(lang);
  return buildMetadata({
    title: dict.pages.cookies.metaTitle,
    description: dict.pages.cookies.metaDescription,
    path: '/cerez-politikasi',
    locale: lang,
  });
}

export default async function CookiePage({ params }: PageProps) {
  await headers();
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const [dict, settings] = await Promise.all([dictForRequest(lang), getSiteSettingsFresh()]);
  const ck = dict.pages.cookies;

  const fill = (text: string) => text.replace('{email}', settings.email);

  // Admin panelinden özel metin girildiyse sözlük içeriği yerine onu göster.
  const custom = settings.cookiePolicyText.trim();
  if (custom) {
    const paragraphs = custom
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return (
      <LegalPage title={ck.title} updated="2026" locale={lang}>
        <LegalSection title={ck.title}>
          {paragraphs.map((para, i) => (
            <p key={i}>{fill(para)}</p>
          ))}
        </LegalSection>
      </LegalPage>
    );
  }

  return (
    <LegalPage title={ck.title} updated="2026" locale={lang}>
      {ck.sections.map((section, i) => (
        <LegalSection key={section.title} title={section.title}>
          {i === 1 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-surface text-foreground">
                  <tr>
                    <th className="p-4 font-medium">{ck.tableHead.type}</th>
                    <th className="p-4 font-medium">{ck.tableHead.purpose}</th>
                    <th className="p-4 font-medium">{ck.tableHead.duration}</th>
                  </tr>
                </thead>
                <tbody>
                  {ck.types.map((c) => (
                    <tr key={c.type} className="border-t border-border">
                      <td className="p-4">{c.type}</td>
                      <td className="p-4">{c.purpose}</td>
                      <td className="p-4 whitespace-nowrap">{c.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            section.body.map((para, j) => <p key={j}>{fill(para)}</p>)
          )}
        </LegalSection>
      ))}
    </LegalPage>
  );
}

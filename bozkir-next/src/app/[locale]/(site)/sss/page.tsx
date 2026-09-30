import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';
import { getContentBlock } from '@/lib/api/content';
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
    title: `${dict.nav.faq} | ${dict.meta.brand}`,
    description: dict.home.block.faq,
    path: '/sss',
    locale: lang,
  });
}

export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const block = await getContentBlock('faq', lang);
  const items = block?.items ?? [];

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.title,
      acceptedAnswer: { '@type': 'Answer', text: item.description },
    })),
  };

  return (
    <>
      <BreadcrumbScript
        locale={lang}
        items={[
          { name: dict.common.home, path: '/' },
          { name: dict.nav.faq, path: '/sss' },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHero
        eyebrow={dict.nav.faq}
        title={block?.title || dict.nav.faq}
        description={block?.body || undefined}
        crumbs={[{ label: dict.common.home, href: '/' }, { label: dict.nav.faq }]}
      />

      <Container className="pb-24 md:pb-32">
        {items.length > 0 ? (
          <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
            {items.map((item) => (
              <details key={item.id} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-start">
                  <span className="text-base font-medium tracking-tight md:text-lg">{item.title}</span>
                  <Plus className="h-5 w-5 flex-none text-muted transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <div className="pb-6 pe-10 text-sm leading-relaxed text-muted-strong">{item.description}</div>
              </details>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            {dict.catalog.empty}
          </p>
        )}
      </Container>
    </>
  );
}

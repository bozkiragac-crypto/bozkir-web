import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { StatsBand } from '@/components/home/StatsBand';
import { AboutTimeline } from '@/components/home/AboutTimeline';
import { QuoteCTA } from '@/components/home/QuoteCTA';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';
import { fetchAboutContent } from '@/lib/data/content';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  return buildMetadata({
    title: dict.pages.about.metaTitle,
    description: dict.pages.about.metaDescription,
    path: '/hakkimizda',
    image: '/images/hero-showroom.jpeg',
    locale: lang,
  });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  const a = dict.pages.about;
  const about = await fetchAboutContent(lang);
  const values = about.values.length ? about.values : a.values;

  return (
    <>
      <BreadcrumbScript locale={lang} items={[{ name: a.crumbHome, path: '/' }, { name: a.crumb, path: '/hakkimizda' }]} />
      <PageHero
        eyebrow={a.heroEyebrow}
        title={a.heroTitle}
        description={a.heroDescription}
        crumbs={[
          { label: a.crumbHome, href: '/' },
          { label: a.crumb },
        ]}
      />

      <Container className="pb-8">
        <StatsBand />
      </Container>

      <AboutTimeline items={about.timeline.length ? about.timeline : undefined} />

      <Container className="pb-16">
        <div className="grid gap-8 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-lg border border-border bg-surface p-7">
              <h3 className="text-lg font-medium tracking-tight">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-strong">{v.text}</p>
            </div>
          ))}
        </div>
      </Container>

      <QuoteCTA locale={lang} />
    </>
  );
}

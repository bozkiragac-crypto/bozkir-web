import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ChapterMark } from '@/components/ui/ChapterMark';
import { ApplicationAreas } from '@/components/home/ApplicationAreas';
import { MaterialGuide } from '@/components/home/MaterialGuide';
import { UsageTabs } from '@/components/home/UsageTabs';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/**
 * "Nerede kullanılır?" + "Hangi panel?" tek bölümde, iki sekme.
 * İki içerik bloğu da DOM'da kalır (SEO), yalnız biri görünür.
 */
export async function UsageAndGuide({
  areas,
  guide,
  locale,
}: {
  areas?: ContentBlock | null;
  guide?: ContentBlock | null;
  locale: Locale;
}) {
  const hasAreas = (areas?.items.length ?? 0) > 0;
  const hasGuide = (guide?.items.length ?? 0) > 0;
  if (!hasAreas && !hasGuide) return null;

  const dict = await dictForRequest(locale);
  const h = dict.home.block;

  const tabs: { id: string; label: string }[] = [];
  const panels: React.ReactNode[] = [];

  if (hasAreas && areas) {
    tabs.push({ id: 'alanlar', label: h.applications });
    panels.push(<ApplicationAreas key="areas" block={areas} locale={locale} bare />);
  }
  if (hasGuide && guide) {
    tabs.push({ id: 'rehber', label: h.guide });
    panels.push(<MaterialGuide key="guide" block={guide} locale={locale} bare />);
  }

  const headingTitle = (hasAreas && areas?.title) || (hasGuide && guide?.title) || h.applications;
  const headingBody = (hasAreas && areas?.body) || (hasGuide && guide?.body) || undefined;

  return (
    <section id="uygulama" className="pad-band border-y border-border bg-surface/40">
      <Container>
        <ChapterMark label={h.applications} className="mb-5" />
        <SectionHeading title={headingTitle} body={headingBody} />
        <UsageTabs items={tabs} ariaLabel={headingTitle}>
          {panels}
        </UsageTabs>
      </Container>
    </section>
  );
}

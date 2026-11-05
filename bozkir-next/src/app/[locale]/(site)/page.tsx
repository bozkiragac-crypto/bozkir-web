import type { Metadata } from 'next';
import { getPrimaryCategories } from '@/lib/api/categories';
import { getActiveCampaigns } from '@/lib/api/campaigns';
import { getContentBlock } from '@/lib/api/content';
import { getSiteSettings } from '@/lib/data/settings';
import { fetchAboutContent } from '@/lib/data/content';
import { fallbackBrands } from '@/data/brands';
import { buildMetadata, jsonLdString } from '@/lib/seo';
import { isLocale } from '@/i18n/config';
import { dictForRequest } from '@/i18n/server';
import { Hero } from '@/components/home/Hero';
import { CampaignSlider } from '@/components/campaigns/CampaignSlider';
import { MaterialStory } from '@/components/home/MaterialStory';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { MaterialGallery } from '@/components/home/MaterialGallery';
import { UsageAndGuide } from '@/components/home/UsageAndGuide';
import { ManifestoStats } from '@/components/home/ManifestoStats';
import { ProcessSteps } from '@/components/home/ProcessSteps';
import { SocialProof } from '@/components/home/SocialProof';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { SupplyLogistics } from '@/components/home/SupplyLogistics';
import { CatalogSection } from '@/components/home/CatalogSection';
import { RecentlyViewed } from '@/components/products/RecentlyViewed';
import { QuoteCTA } from '@/components/home/QuoteCTA';
import { ScrollSpyRail } from '@/components/layout/ScrollSpyRail';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = await dictForRequest(lang);
  // Admin panelindeki SEO ayarları varsa site başlığı/açıklamasını onlar belirler.
  const seo = await getSiteSettings();
  return buildMetadata({
    title: seo.seoTitle || dict.meta.home,
    description: seo.seoDescription || dict.meta.homeDescription,
    image: seo.ogImage || '/images/og-home.jpg',
    path: '/',
    locale: lang,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = await dictForRequest(lang);
  const [
    allCategories,
    campaigns,
    gallery,
    guide,
    applications,
    process,
    faq,
    testimonials,
    settings,
    aboutStats,
  ] = await Promise.all([
    getPrimaryCategories(lang),
    getActiveCampaigns(lang),
    getContentBlock('gallery', lang),
    getContentBlock('guide', lang),
    getContentBlock('applications', lang),
    getContentBlock('process', lang),
    getContentBlock('faq', lang),
    getContentBlock('testimonials', lang),
    getSiteSettings(),
    fetchAboutContent(lang),
  ]);

  // Admin'de tanımlı vitrin sırası varsa uygula.
  const order = settings.featuredOrder;
  const categories =
    order.length > 0
      ? [...allCategories].sort((a, b) => {
          const ai = order.indexOf(a.slug);
          const bi = order.indexOf(b.slug);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        })
      : allCategories;

  // Gerçek (uydurma olmayan) referanslar varsa Organization Review şeması eklenir.
  const reviews = (testimonials?.items ?? []).filter((i) => i.description && i.title);

  // Sağdaki bölüm göstergesi (yalnızca render edilen bölümler).
  const hasUsage = (applications?.items.length ?? 0) > 0 || (guide?.items.length ?? 0) > 0;
  const railItems = [
    { id: 'malzeme', label: dict.home.story.eyebrow },
    ...(gallery ? [{ id: 'vitrin', label: dict.home.block.showcase }] : []),
    ...(hasUsage ? [{ id: 'uygulama', label: dict.home.block.applications }] : []),
    ...(process ? [{ id: 'surec', label: dict.home.block.process }] : []),
    ...(faq ? [{ id: 'sss', label: dict.home.block.faq }] : []),
  ];

  return (
    <>
      {reviews.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdString({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: dict.meta.brand,
              review: reviews.map((r) => ({
                '@type': 'Review',
                reviewBody: r.description,
                author: { '@type': 'Person', name: r.title },
              })),
            }),
          }}
        />
      )}
      {/* Ana sayfa baştan sona karanlık "showroom" olarak sunulur. */}
      <div data-night className="bg-background text-foreground">
        <Hero image={settings.heroImage || undefined} />
        <CampaignSlider campaigns={campaigns} />
        <MaterialStory categories={categories} />
        <FeaturedProducts locale={lang} />
        {gallery && <MaterialGallery block={gallery} locale={lang} />}
        <UsageAndGuide areas={applications} guide={guide} locale={lang} />
        <ManifestoStats locale={lang} stats={aboutStats.stats} />
        {process && <ProcessSteps block={process} locale={lang} />}
        <CatalogSection locale={lang} />
        <SocialProof testimonials={testimonials} brands={fallbackBrands} locale={lang} />
        <SupplyLogistics locale={lang} />
        {faq && <FaqAccordion block={faq} locale={lang} />}
        <RecentlyViewed />
        <QuoteCTA locale={lang} />
        <ScrollSpyRail items={railItems} ariaLabel={dict.common.sections} />
      </div>
    </>
  );
}

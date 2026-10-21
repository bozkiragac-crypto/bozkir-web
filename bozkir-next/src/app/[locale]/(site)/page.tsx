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
import { ProductShowcase } from '@/components/home/ProductShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Manifesto } from '@/components/home/Manifesto';
import { MaterialGallery } from '@/components/home/MaterialGallery';
import { MaterialGuide } from '@/components/home/MaterialGuide';
import { ApplicationAreas } from '@/components/home/ApplicationAreas';
import { Material3D } from '@/components/home/Material3D';
import { ProcessSteps } from '@/components/home/ProcessSteps';
import { BrandPartners } from '@/components/home/BrandPartners';
import { StatsBand } from '@/components/home/StatsBand';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { SupplyLogistics } from '@/components/home/SupplyLogistics';
import { CatalogSection } from '@/components/home/CatalogSection';
import { Testimonials } from '@/components/home/Testimonials';
import { RecentlyViewed } from '@/components/products/RecentlyViewed';
import { QuoteCTA } from '@/components/home/QuoteCTA';
import { Container } from '@/components/ui/Container';
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
  const railItems = [
    { id: 'malzeme', label: dict.home.story.eyebrow },
    { id: 'koleksiyon', label: dict.home.showcase.eyebrow },
    ...(gallery ? [{ id: 'vitrin', label: dict.home.block.showcase }] : []),
    ...(guide ? [{ id: 'rehber', label: dict.home.block.guide }] : []),
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
      <Hero image={settings.heroImage || undefined} />
      <CampaignSlider campaigns={campaigns} />
      <MaterialStory categories={categories} />
      <ProductShowcase categories={categories} locale={lang} />
      <FeaturedProducts locale={lang} />
      <Manifesto locale={lang} />
      {gallery && <MaterialGallery block={gallery} locale={lang} />}
      {guide && <MaterialGuide block={guide} locale={lang} />}
      {applications && <ApplicationAreas block={applications} locale={lang} />}
      <Material3D locale={lang} />
      {process && <ProcessSteps block={process} locale={lang} />}
      <BrandPartners brands={fallbackBrands} locale={lang} />
      <Container className="pb-24 md:pb-32">
        <StatsBand stats={aboutStats.stats} />
      </Container>
      {faq && <FaqAccordion block={faq} locale={lang} />}
      <SupplyLogistics locale={lang} />
      <CatalogSection locale={lang} />
      {testimonials && <Testimonials block={testimonials} locale={lang} />}
      <RecentlyViewed />
      <QuoteCTA locale={lang} />
      <ScrollSpyRail items={railItems} ariaLabel={dict.common.sections} />
    </>
  );
}

import type { Metadata } from 'next';
import { getPrimaryCategories } from '@/lib/api/categories';
import { getActiveCampaigns } from '@/lib/api/campaigns';
import { getContentBlock } from '@/lib/api/content';
import { getSiteSettings } from '@/lib/data/settings';
import { fallbackBrands } from '@/data/brands';
import { buildMetadata } from '@/lib/seo';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { Hero } from '@/components/home/Hero';
import { CampaignSlider } from '@/components/campaigns/CampaignSlider';
import { MaterialStory } from '@/components/home/MaterialStory';
import { ProductShowcase } from '@/components/home/ProductShowcase';
import { Manifesto } from '@/components/home/Manifesto';
import { MaterialGallery } from '@/components/home/MaterialGallery';
import { MaterialGuide } from '@/components/home/MaterialGuide';
import { ApplicationAreas } from '@/components/home/ApplicationAreas';
import { Material3D } from '@/components/home/Material3D';
import { ProcessSteps } from '@/components/home/ProcessSteps';
import { BrandPartners } from '@/components/home/BrandPartners';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { SupplyLogistics } from '@/components/home/SupplyLogistics';
import { CatalogSection } from '@/components/home/CatalogSection';
import { QuoteCTA } from '@/components/home/QuoteCTA';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const dict = getDictionary(lang);
  return buildMetadata({
    title: dict.meta.home,
    description: dict.meta.homeDescription,
    path: '/',
    locale: lang,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = isLocale(locale) ? locale : 'tr';
  const [allCategories, campaigns, gallery, guide, applications, process, faq, settings] = await Promise.all([
    getPrimaryCategories(lang),
    getActiveCampaigns(lang),
    getContentBlock('gallery', lang),
    getContentBlock('guide', lang),
    getContentBlock('applications', lang),
    getContentBlock('process', lang),
    getContentBlock('faq', lang),
    getSiteSettings(),
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

  return (
    <>
      <Hero />
      <CampaignSlider campaigns={campaigns} />
      <MaterialStory categories={categories} />
      <ProductShowcase categories={categories} locale={lang} />
      <Manifesto locale={lang} />
      {gallery && <MaterialGallery block={gallery} locale={lang} />}
      {guide && <MaterialGuide block={guide} locale={lang} />}
      {applications && <ApplicationAreas block={applications} locale={lang} />}
      <Material3D locale={lang} />
      {process && <ProcessSteps block={process} locale={lang} />}
      <BrandPartners brands={fallbackBrands} locale={lang} />
      {faq && <FaqAccordion block={faq} locale={lang} />}
      <SupplyLogistics locale={lang} />
      <CatalogSection locale={lang} />
      <QuoteCTA locale={lang} />
    </>
  );
}

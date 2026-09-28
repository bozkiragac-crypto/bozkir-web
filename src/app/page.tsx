import type { Metadata } from 'next';
import { getPrimaryCategories } from '@/lib/api/categories';
import { fallbackBrands } from '@/data/brands';
import { buildMetadata } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import { MaterialStory } from '@/components/home/MaterialStory';
import { ProductShowcase } from '@/components/home/ProductShowcase';
import { Material3D } from '@/components/home/Material3D';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { BrandPartners } from '@/components/home/BrandPartners';
import { SupplyLogistics } from '@/components/home/SupplyLogistics';
import { AboutTimeline } from '@/components/home/AboutTimeline';
import { CatalogSection } from '@/components/home/CatalogSection';
import { QuoteCTA } from '@/components/home/QuoteCTA';

export const metadata: Metadata = buildMetadata({
  title: 'Bozkır Ağaç Ürünleri | Malzemenin Yeni Formu',
  description:
    'Mobilya ve iç mekân üreticileri için MDF lam, lake panel, suntalam, sunta, MDF ve tamamlayıcı panel çözümleri.',
  path: '/',
});

export default async function HomePage() {
  const categories = await getPrimaryCategories();

  return (
    <>
      <Hero />
      <MaterialStory categories={categories} />
      <ProductShowcase categories={categories} />
      <Material3D />
      <CategoryStrip categories={categories} />
      <BrandPartners brands={fallbackBrands} />
      <SupplyLogistics />
      <AboutTimeline />
      <CatalogSection />
      <QuoteCTA />
    </>
  );
}

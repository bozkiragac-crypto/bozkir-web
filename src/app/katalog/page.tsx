import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { CatalogSection } from '@/components/home/CatalogSection';
import { QuoteCTA } from '@/components/home/QuoteCTA';

export const metadata: Metadata = buildMetadata({
  title: 'Katalog | Bozkır Ağaç Ürünleri',
  description: 'Bozkır Ağaç Ürünleri ürün kataloğu.',
  path: '/katalog',
});

export default function CatalogPage() {
  return (
    <>
      <PageHero
        eyebrow="Katalog"
        title="Ürün kataloğu"
        description="Tüm ürün gruplarını, dekor ve renk seçeneklerini tek dokümanda inceleyin."
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Katalog' },
        ]}
      />
      <CatalogSection />
      <QuoteCTA />
    </>
  );
}

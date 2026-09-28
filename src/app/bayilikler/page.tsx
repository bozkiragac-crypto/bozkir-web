import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { fallbackBrands } from '@/data/brands';
import { PageHero } from '@/components/ui/PageHero';
import { BrandPartners } from '@/components/home/BrandPartners';
import { QuoteCTA } from '@/components/home/QuoteCTA';

export const metadata: Metadata = buildMetadata({
  title: 'Bayilikler | Bozkır Ağaç Ürünleri',
  description: 'Yıldız Entegre, Teverpan, Apel Tutkal ve HSÇ Plastik yetkili bayiliği.',
  path: '/bayilikler',
});

export default function DealersPage() {
  return (
    <>
      <PageHero
        eyebrow="Bayilikler"
        title="Çalıştığımız markalar"
        description="Güvenilir üreticilerin yetkili bayisi olarak, doğru ürünü doğru kaynaktan tedarik ediyoruz."
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Bayilikler' },
        ]}
      />
      <div className="-mt-16">
        <BrandPartners brands={fallbackBrands} />
      </div>
      <QuoteCTA />
    </>
  );
}

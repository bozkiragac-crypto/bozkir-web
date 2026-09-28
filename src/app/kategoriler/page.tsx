import type { Metadata } from 'next';
import { getCategories } from '@/lib/api/categories';
import { buildMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { CategoryStrip } from '@/components/home/CategoryStrip';

export const metadata: Metadata = buildMetadata({
  title: 'Koleksiyonlar | Bozkır Ağaç Ürünleri',
  description: 'MDF lam, lake panel, kapı panel, suntalam, sunta, MDF, duvar profili ve PVC kenar bant koleksiyonları.',
  path: '/kategoriler',
});

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <PageHero
        eyebrow="Koleksiyonlar"
        title="Malzeme koleksiyonları"
        description="Her ürün grubunu yakından tanıyın; yüzey, renk ve uygulama seçeneklerini keşfedin."
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Koleksiyonlar' },
        ]}
      />
      <CategoryStrip categories={categories} />
    </>
  );
}

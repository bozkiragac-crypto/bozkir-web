import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getCategories, getCategoryBySlug } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { Reveal } from '@/components/animations/Reveal';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return buildMetadata({ title: 'Koleksiyon bulunamadı | Bozkır Ağaç Ürünleri', path: `/kategoriler/${slug}` });
  return buildMetadata({
    title: category.seoTitle ?? `${category.name} | Bozkır Ağaç Ürünleri`,
    description: category.seoDescription ?? category.description,
    path: `/kategoriler/${category.slug}`,
    image: category.heroImage,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, all, { items }] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getProducts({ category: slug, limit: 60 }),
  ]);

  if (!category) notFound();

  const others = all.filter((c) => c.featured && c.slug !== category.slug).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Ana Sayfa', path: '/' },
              { name: 'Koleksiyonlar', path: '/kategoriler' },
              { name: category.name, path: `/kategoriler/${category.slug}` },
            ]),
          ),
        }}
      />
      <PageHero
        eyebrow="Koleksiyon"
        title={category.name}
        description={category.description}
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Koleksiyonlar', href: '/kategoriler' },
          { label: category.name },
        ]}
      />

      <Container className="pb-16">
        <Reveal>
          <div className="relative aspect-[21/9] overflow-hidden rounded-lg bg-surface-2">
            {category.heroImage ? (
              <Image src={category.heroImage} alt={category.name} fill sizes="100vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">Görsel eklenecek</div>
            )}
          </div>
        </Reveal>
      </Container>

      <Container className="pb-24 md:pb-32">
        {items.length > 0 ? (
          <>
            <p className="numerals mb-8 text-sm text-muted">{items.length} ürün</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-10 text-center">
            <p className="text-sm text-muted-strong">
              Bu koleksiyonda şu anda listelenen ürün yok. Teklif için bize ulaşabilirsiniz.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <ButtonLink href="/teklif-al" variant="outline">
                Teklif Al
              </ButtonLink>
              <ButtonLink href="/iletisim">İletişim</ButtonLink>
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-24">
            <p className="text-eyebrow mb-6">Diğer koleksiyonlar</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/kategoriler/${c.slug}`}
                    className="group flex items-center justify-between rounded-md border border-border p-5 transition-colors hover:bg-surface"
                  >
                    <span className="font-medium tracking-tight">{c.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </>
  );
}

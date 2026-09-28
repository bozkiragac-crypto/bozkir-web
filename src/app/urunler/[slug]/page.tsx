import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProductBySlug } from '@/lib/api/products';
import { absoluteUrl, buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return buildMetadata({ title: 'Ürün bulunamadı | Bozkır Ağaç Ürünleri', path: `/urunler/${slug}` });
  const desc =
    product.shortDescription ??
    `${product.name}${product.code ? ` (${product.code})` : ''} · ${product.category}. Bozkır Ağaç Ürünleri güvencesiyle.`;
  return buildMetadata({
    title: `${product.name} | Bozkır Ağaç Ürünleri`,
    description: desc,
    path: `/urunler/${product.slug}`,
    image: product.images[0] ?? product.thumbnail,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const image = product.images[0] ?? product.thumbnail;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.code || undefined,
    category: product.category,
    image: image ? [image] : undefined,
    brand: { '@type': 'Brand', name: 'Bozkır Ağaç Ürünleri' },
    url: absoluteUrl(`/urunler/${product.slug}`),
  };

  const specs: { label: string; value: string }[] = [];
  if (product.code) specs.push({ label: 'Ürün Kodu', value: product.code });
  specs.push({ label: 'Kategori', value: product.category });
  if (product.face) specs.push({ label: 'Yüzey', value: product.face });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Ana Sayfa', path: '/' },
              { name: 'Ürünler', path: '/urunler' },
              { name: product.name, path: `/urunler/${product.slug}` },
            ]),
          ),
        }}
      />

      <PageHero
        eyebrow={product.category}
        title={product.name}
        crumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Ürünler', href: '/urunler' },
          { label: product.name },
        ]}
      />

      <Container className="pb-24 md:pb-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-2">
            {image ? (
              <Image src={image} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">Görsel hazırlanıyor</div>
            )}
          </div>

          <div>
            <dl className="border-t border-border">
              {specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-6 border-b border-border py-4 text-sm">
                  <dt className="text-muted-strong">{spec.label}</dt>
                  <dd className="text-right">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href="/teklif-al" size="lg">
                Teklif Al
              </ButtonLink>
              <ButtonLink
                href={`/kategoriler/${product.categorySlug}`}
                size="lg"
                variant="outline"
              >
                Koleksiyonu Gör
              </ButtonLink>
            </div>

            <Link href="/urunler" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Tüm ürünler
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}

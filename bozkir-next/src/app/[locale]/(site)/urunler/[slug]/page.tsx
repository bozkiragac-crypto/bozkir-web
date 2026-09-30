import type { Metadata } from 'next';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '@/lib/api/products';
import { siteConfig } from '@/config/site';
import { telHref } from '@/lib/phone';
import { buildMetadata, breadcrumbJsonLd, localeUrl } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductCard } from '@/components/products/ProductCard';
import { FavoriteButton, CompareButton } from '@/components/products/WishButtons';
import { ShareButton } from '@/components/products/ShareButton';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
  const product = await getProductBySlug(slug, locale);
  if (!product) {
    return buildMetadata({
      title: dict.product.notFound,
      path: `/urunler/${slug}`,
      noIndex: true,
      locale,
    });
  }
  const desc =
    product.shortDescription ??
    `${product.name}${product.code ? ` (${product.code})` : ''} · ${product.category}. ${dict.meta.brandTagline}`;
  return buildMetadata({
    title: `${product.name} | ${dict.meta.brand}`,
    description: desc,
    path: `/urunler/${product.slug}`,
    // Dinamik OG görseli: opengraph-image.tsx dosya-convention ile üretilir.
    image: null,
    locale,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug, locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
  const [product] = await Promise.all([
    getProductBySlug(slug, locale),
  ]);
  if (!product) notFound();

  const settings = siteConfig;
  const related = await getRelatedProducts(product.slug, locale, 4);

  const image = product.images[0] ?? product.thumbnail;

  const ref = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    code: product.code,
    category: product.category,
    face: product.face,
    image,
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.code || undefined,
    category: product.category,
    image: image ? [image] : undefined,
    brand: { '@type': 'Brand', name: dict.meta.brand },
    url: localeUrl(locale, `/urunler/${product.slug}`),
  };

  const specs: { label: string; value: string }[] = [];
  if (product.code) specs.push({ label: dict.compare.code, value: product.code });
  specs.push({ label: dict.compare.category, value: product.category });
  if (product.face) specs.push({ label: dict.compare.surface, value: product.face });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: dict.common.home, path: '/' },
                { name: dict.nav.products, path: '/urunler' },
                { name: product.name, path: `/urunler/${product.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />

      <PageHero
        eyebrow={product.category}
        title={product.name}
        crumbs={[
          { label: dict.common.home, href: '/' },
          { label: dict.nav.products, href: '/urunler' },
          { label: product.name },
        ]}
      />

      <Container className="pb-40 md:pb-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <ProductGallery images={product.images} alt={product.name} />

          <div>
            <dl className="border-t border-border">
              {specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-4 border-b border-border py-4 text-sm">
                  <dt className="flex-none text-muted-strong">{spec.label}</dt>
                  <dd className="min-w-0 break-words text-end">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton>
                <ButtonLink href={`/teklif-al?urun=${encodeURIComponent(product.slug)}`} size="lg">
                  {dict.common.getQuote}
                </ButtonLink>
              </MagneticButton>
              <MagneticButton>
                <ButtonLink href={`/kategoriler/${product.categorySlug}`} size="lg" variant="outline">
                  {dict.common.seeCollection}
                </ButtonLink>
              </MagneticButton>
              <div className="flex items-center gap-2">
                <FavoriteButton product={ref} className="h-11 w-11" />
                <CompareButton product={ref} className="h-11 w-11" />
                <ShareButton
                  name={product.name}
                  url={localeUrl(locale, `/urunler/${product.slug}`)}
                  imageUrl={image}
                  className="h-11 w-11"
                />
              </div>
            </div>

            <Link href="/urunler" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> {dict.common.allProducts}
            </Link>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="pb-40 md:pb-32">
          <div className="border-t border-border pt-12">
            <h2 className="text-headline text-2xl md:text-3xl">{dict.product.related}</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </Container>
      )}

      {/* Mobil sabit CTA çubuğu */}
      <div
        data-product-cta
        className="fixed inset-x-0 bottom-0 z-[70] flex gap-3 border-t border-border bg-background/95 px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3 backdrop-blur md:hidden"
      >
        <a
          href={telHref(settings.phone)}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium"
        >
          {dict.common.phone}
        </a>
        <Link
          href={`/teklif-al?urun=${encodeURIComponent(product.slug)}`}
          className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background"
        >
          {dict.common.getQuote}
        </Link>
      </div>
    </>
  );
}

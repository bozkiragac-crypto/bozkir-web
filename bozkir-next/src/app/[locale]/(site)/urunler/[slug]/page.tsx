import type { Metadata } from 'next';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import {
  getAdjacentProducts,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
} from '@/lib/api/products';
import { getSiteSettings } from '@/lib/data/settings';
import { siteConfig } from '@/config/site';
import { telHref } from '@/lib/phone';
import { buildProductWhatsAppMessage, whatsappHref } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import {
  buildMetadata,
  breadcrumbJsonLd,
  localeUrl,
  jsonLdString,
  productJsonLd,
} from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ProductGallery } from '@/components/products/ProductGallery';
import { SampleRequestLink } from '@/components/products/SampleRequestLink';
import { ProductCard } from '@/components/products/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { FavoriteButton, CompareButton } from '@/components/products/WishButtons';
import { ShareButton } from '@/components/products/ShareButton';
import { PrintButton } from '@/components/products/PrintButton';
import { ProductViewTracker } from '@/components/analytics/ProductViewTracker';
import { RecentlyViewed } from '@/components/products/RecentlyViewed';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { isLocale } from '@/i18n/config';
import { dictForRequest } from '@/i18n/server';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

/**
 * Panel ↔ kenar bandı eşlemesi: ürün detayında "uyumlu ürünler" bölümünde
 * gösterilecek kategori. Anahtar ürünün kategorisi, değer hedef kategori.
 */
const COMPATIBLE_CATEGORY: Record<string, string> = {
  'pvc-kenar-bant': 'mdflam',
  mdflam: 'pvc-kenar-bant',
  'lak-panel': 'pvc-kenar-bant',
  suntalam: 'pvc-kenar-bant',
  sunta: 'pvc-kenar-bant',
  mdf: 'pvc-kenar-bant',
  'kaplamali-mdf': 'pvc-kenar-bant',
  'kapi-panel': 'pvc-kenar-bant',
};

export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = await dictForRequest(locale ?? 'tr');
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
    title: product.seoTitle ?? `${product.name} | ${dict.meta.brand}`,
    description: product.seoDescription ?? desc,
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
  const dict = await dictForRequest(locale ?? 'tr');
  const [product, siteSettings] = await Promise.all([
    getProductBySlug(slug, locale),
    getSiteSettings(),
  ]);
  if (!product) notFound();

  const settings = siteConfig;
  const compatibleCategory = COMPATIBLE_CATEGORY[product.categorySlug];
  const [related, adjacent, compatibleResult] = await Promise.all([
    getRelatedProducts(product.slug, locale, 4),
    getAdjacentProducts(product, locale),
    compatibleCategory
      ? getProducts({ category: compatibleCategory, limit: 4 }, locale)
      : Promise.resolve(null),
  ]);
  const compatible =
    compatibleResult?.items.filter((item) => item.slug !== product.slug).slice(0, 4) ?? [];

  const image = product.images[0] ?? product.thumbnail;
  const productUrl = localeUrl(locale, `/urunler/${product.slug}`);
  const whatsappMessage = buildProductWhatsAppMessage(
    product,
    siteSettings.whatsappMessages,
    locale ?? 'tr',
    productUrl,
  );
  const whatsappLink = whatsappHref(
    siteSettings.whatsapp || siteSettings.phone,
    whatsappMessage,
    siteSettings.phone,
  );
  const sampleMessage = dict.product.sampleMessage.replace(
    '{product}',
    `${product.name}${product.code ? ` (${product.code})` : ''}`,
  );
  const sampleLink = whatsappHref(
    siteSettings.whatsapp || siteSettings.phone,
    sampleMessage,
    siteSettings.phone,
  );

  const ref = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    code: product.code,
    category: product.category,
    face: product.face,
    image,
  };

  // JSON-LD yalnızca gerçek (DB/admin) verisini kullanır; boş alanlar eklenmez.
  const jsonLdProperties: { name: string; value: string }[] = [];
  if (product.face) jsonLdProperties.push({ name: dict.compare.surface, value: product.face });
  if (product.dimensions) {
    jsonLdProperties.push({ name: dict.product.dimensions, value: product.dimensions });
  }
  if (product.thicknesses?.length) {
    jsonLdProperties.push({
      name: dict.compare.thickness,
      value: product.thicknesses.join(' · '),
    });
  }
  if (product.colors?.length) {
    jsonLdProperties.push({ name: dict.product.colors, value: product.colors.join(' · ') });
  }
  const productSchema = productJsonLd({
    name: product.name,
    description:
      product.description ??
      product.shortDescription ??
      `${product.name}${product.code ? ` (${product.code})` : ''} · ${product.category}`,
    url: productUrl,
    category: product.category,
    brandName: dict.meta.brand,
    code: product.code,
    images: product.images.length > 0 ? product.images : image ? [image] : [],
    properties: jsonLdProperties,
  });

  const specs: { label: string; value: string }[] = [];
  if (product.code) specs.push({ label: dict.compare.code, value: product.code });
  specs.push({ label: dict.compare.category, value: product.category });
  if (product.face) specs.push({ label: dict.compare.surface, value: product.face });
  if (product.dimensions) specs.push({ label: dict.product.dimensions, value: product.dimensions });
  if (product.thicknesses?.length) {
    specs.push({ label: dict.compare.thickness, value: product.thicknesses.join(' · ') });
  }

  // Detay bölümü: hızlı özet + kalınlık/renk + admin'den girilen teknik özellikler.
  // Aynı etiket iki kez görünmesin (ör. teknik özellik olarak "Kod" girilmişse).
  const detailSpecs = [...specs];
  if (product.colors?.length) {
    detailSpecs.push({ label: dict.product.colors, value: product.colors.join(' · ') });
  }
  const seen = new Set(detailSpecs.map((s) => s.label.trim().toLocaleLowerCase('tr')));
  for (const spec of product.technicalSpecs ?? []) {
    const key = spec.label.trim().toLocaleLowerCase('tr');
    if (seen.has(key)) continue;
    seen.add(key);
    detailSpecs.push(spec);
  }
  const extendedSpecs = detailSpecs.slice(specs.length);
  const applications = product.applications ?? [];
  const documents = product.documents ?? [];

  return (
    <div data-print-page>
      <ProductViewTracker
        slug={product.slug}
        name={product.name}
        category={product.category}
        product={ref}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
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

      <div data-print-area>
        <PageHero
          eyebrow={product.category}
          eyebrowClassName="print:hidden"
          title={product.name}
          leading={
            <BrandLogo
              className="mb-6 h-14"
              priority
              alt={dict.meta.brand}
              src={siteSettings.identity.logo}
            />
          }
          crumbs={[
            { label: dict.common.home, href: '/' },
            { label: dict.nav.products, href: '/urunler' },
            { label: product.name },
          ]}
          className="print:pt-0 print:pb-4"
        />

        <Container className="pb-40 md:pb-32 print:pb-0">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 print:grid-cols-2 print:items-start print:gap-8">
            <ProductGallery images={product.images} alt={product.name} />

            <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
              {product.shortDescription && (
                <p className="mb-6 text-base leading-relaxed text-muted-strong">
                  {product.shortDescription}
                </p>
              )}
              <dl className="border-t border-border">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className={cn(
                      '-mx-3 flex justify-between gap-4 rounded-md border-b border-border px-3 py-4 text-sm transition-colors hover:bg-surface-2',
                      spec.label === dict.compare.category && 'print:hidden',
                    )}
                  >
                    <dt className="flex-none text-muted-strong">{spec.label}</dt>
                    <dd className="min-w-0 break-words text-end">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="no-print mt-10 flex flex-wrap items-center gap-4">
                <MagneticButton>
                  <ButtonLink
                    href={`/teklif-al?urun=${encodeURIComponent(product.slug)}`}
                    size="lg"
                  >
                    {dict.common.getQuote}
                  </ButtonLink>
                </MagneticButton>
                <MagneticButton>
                  <ButtonLink
                    href={`/kategoriler/${product.categorySlug}`}
                    size="lg"
                    variant="outline"
                  >
                    {dict.common.seeCollection}
                  </ButtonLink>
                </MagneticButton>
                <div className="flex items-center gap-2">
                  <FavoriteButton product={ref} className="h-11 w-11" />
                  <CompareButton product={ref} className="h-11 w-11" />
                  <ShareButton
                    name={product.name}
                    url={productUrl}
                    imageUrl={image}
                    message={whatsappMessage}
                    className="h-11 w-11"
                  />
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={dict.pages.whatsapp.aria}
                      title={dict.pages.whatsapp.aria}
                      className="no-print flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 text-[#25D366] backdrop-blur transition active:scale-95 hover:border-foreground"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                    </a>
                  )}
                  <PrintButton className="no-print" />
                </div>
              </div>

              {sampleLink && (
                <SampleRequestLink
                  href={sampleLink}
                  label={dict.product.sampleRequest}
                  openingLabel={dict.product.sampleOpening}
                  productSlug={product.slug}
                />
              )}

              <Link
                href="/urunler"
                className="tap-target no-print mt-8 inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {dict.common.allProducts}
              </Link>
            </div>
          </div>
        </Container>

        {(product.description ||
          extendedSpecs.length > 0 ||
          applications.length > 0 ||
          documents.length > 0) && (
          <Container className="pb-16 md:pb-20 print:pb-0">
            <div className="grid gap-10 border-t border-border pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
              <div className="grid content-start gap-10">
                {product.description && (
                  <section>
                    <h2 className="text-section">{dict.product.description}</h2>
                    <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-strong">
                      {product.description}
                    </p>
                  </section>
                )}

                {applications.length > 0 && (
                  <section>
                    <h2 className="text-sm tracking-[0.14em] text-muted uppercase">
                      {dict.product.applications}
                    </h2>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {applications.map((application) => (
                        <li
                          key={application}
                          className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-strong"
                        >
                          {application}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <div className="grid content-start gap-10">
                {extendedSpecs.length > 0 && (
                  <section>
                    <h2 className="text-section">{dict.product.technicalSpecs}</h2>
                    <dl className="mt-4 border-t border-border">
                      {extendedSpecs.map((spec) => (
                        <div
                          key={spec.label}
                          className="-mx-3 flex justify-between gap-4 rounded-md border-b border-border px-3 py-3 text-sm transition-colors hover:bg-surface-2"
                        >
                          <dt className="flex-none text-muted-strong">{spec.label}</dt>
                          <dd className="min-w-0 break-words text-end">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                {documents.length > 0 && (
                  <section>
                    <h2 className="text-sm tracking-[0.14em] text-muted uppercase">
                      {dict.product.documents}
                    </h2>
                    <ul className="mt-4 grid gap-2">
                      {documents.map((doc) => (
                        <li key={`${doc.title}-${doc.url}`}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-3 text-sm transition-colors hover:border-foreground"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <FileText className="h-4 w-4 flex-none text-muted" />
                              <span className="truncate">{doc.title}</span>
                            </span>
                            <span className="flex-none text-xs text-muted uppercase">PDF</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          </Container>
        )}
      </div>

      {(adjacent.prev || adjacent.next) && (
        <Container className="pb-16 md:pb-20">
          <nav
            aria-label={dict.nav.products}
            className="flex items-center justify-between gap-4 border-y border-border py-5"
          >
            {adjacent.prev ? (
              <Link
                href={`/urunler/${adjacent.prev.slug}`}
                className="tap-target group flex min-w-0 items-center gap-3 text-sm text-muted-strong transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 flex-none rtl:-scale-x-100" />
                <span className="min-w-0">
                  <span className="block text-[0.75rem] tracking-[0.14em] text-muted uppercase">
                    {dict.common.prev}
                  </span>
                  <span className="block truncate font-medium">{adjacent.prev.name}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {adjacent.next ? (
              <Link
                href={`/urunler/${adjacent.next.slug}`}
                className="tap-target group flex min-w-0 items-center gap-3 text-end text-sm text-muted-strong transition-colors hover:text-foreground"
              >
                <span className="min-w-0">
                  <span className="block text-[0.75rem] tracking-[0.14em] text-muted uppercase">
                    {dict.common.next}
                  </span>
                  <span className="block truncate font-medium">{adjacent.next.name}</span>
                </span>
                <ArrowRight className="h-4 w-4 flex-none rtl:-scale-x-100" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </Container>
      )}

      {compatible.length > 0 && (
        <Container className="pb-16 md:pb-20">
          <SectionHeading eyebrow={dict.nav.products} title={dict.product.compatible} />
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
            {compatible.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.05}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </Container>
      )}

      {related.length > 0 && (
        <Container className="pb-40 md:pb-32">
          <SectionHeading eyebrow={product.category} title={dict.product.related} />
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.05}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </Container>
      )}

      <RecentlyViewed excludeSlug={product.slug} />

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
    </div>
  );
}

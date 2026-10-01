import type { Metadata } from 'next';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { Suspense } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getCategories } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import { buildMetadata, absoluteUrl } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ProductFilter } from '@/components/products/ProductFilter';
import { ProductCard } from '@/components/products/ProductCard';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { BreadcrumbScript } from '@/components/seo/BreadcrumbScript';

const PAGE_SIZE = 24;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined) {
  return typeof v === 'string' ? v : undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
  return buildMetadata({
    title: dict.productsPage.metaTitle,
    description: dict.productsPage.metaDescription,
    path: '/urunler',
    locale,
  });
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const [{ locale: localeParam }, sp] = await Promise.all([params, searchParams]);
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
  const kategori = str(sp.kategori);
  const q = str(sp.q);
  const page = Math.max(1, parseInt(str(sp.sayfa) ?? '1', 10) || 1);
  const sortParam = str(sp.sirala);
  const sort =
    sortParam === 'name-asc' || sortParam === 'name-desc' || sortParam === 'code-asc'
      ? sortParam
      : undefined;

  const [categories, result] = await Promise.all([
    getCategories(locale),
    getProducts({ category: kategori, query: q, sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }, locale),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const hasFilters = Boolean(q || kategori);
  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (kategori) params.set('kategori', kategori);
    if (sort) params.set('sirala', sort);
    if (target > 1) params.set('sayfa', String(target));
    const qs = params.toString();
    return `/urunler${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <BreadcrumbScript
        locale={locale ?? 'tr'}
        items={[
          { name: dict.common.home, path: '/' },
          { name: dict.nav.products, path: '/urunler' },
        ]}
      />
      {result.items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: result.items.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: absoluteUrl(`/${locale ?? 'tr'}/urunler/${p.slug}`),
                name: p.name,
              })),
            }),
          }}
        />
      )}
      <PageHero
        eyebrow={dict.catalog.title}
        title={dict.nav.products}
        description={dict.productsPage.metaDescription}
        crumbs={[
          { label: dict.common.home, href: '/' },
          { label: dict.nav.products },
        ]}
      >
        <div className="mt-10">
          <Suspense fallback={<div className="h-20" />}>
            <ProductFilter categories={categories} />
          </Suspense>
        </div>
      </PageHero>

      <Container className="pb-24 md:pb-32">
        {result.items.length > 0 ? (
          <>
            <p className="numerals mb-8 text-sm text-muted">
              {result.total} {dict.catalog.title.toLocaleLowerCase(locale ?? 'tr')}
              {totalPages > 1
                ? ` · ${dict.common.page} ${page}/${totalPages}`
                : ''}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
              {result.items.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i === 0} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-16 flex items-center justify-between border-t border-border pt-8" aria-label={dict.common.page}>
                {page > 1 ? (
                  <Link href={buildHref(page - 1)} className="inline-flex items-center gap-2 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {dict.common.prev}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="numerals text-sm text-muted">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link href={buildHref(page + 1)} className="inline-flex items-center gap-2 text-sm font-medium">
                    {dict.common.next} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-12 text-center">
            <h2 className="text-xl font-medium tracking-tight">
              {hasFilters ? dict.catalog.noResults : dict.common.notFound}
            </h2>
            <p className="mt-3 text-sm text-muted-strong">{dict.catalog.empty}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {hasFilters && (
                <Link
                  href="/urunler"
                  className="inline-flex h-12 items-center rounded-full border border-border px-7 text-sm font-medium"
                >
                  {dict.catalog.clearFilters}
                </Link>
              )}
              <Link
                href="/teklif-al"
                className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-medium text-background"
              >
                {dict.nav.quote}
              </Link>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}

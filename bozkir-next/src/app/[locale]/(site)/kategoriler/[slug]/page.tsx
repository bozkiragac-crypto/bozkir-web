import type { Metadata } from 'next';
import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';
import { getCategories, getCategoryBySlug } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { PageHero } from '@/components/ui/PageHero';
import { Container } from '@/components/ui/Container';
import { ButtonLink } from '@/components/ui/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { CategorySearch } from '@/components/products/CategorySearch';
import { Reveal } from '@/components/animations/Reveal';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

const PAGE_SIZE = 24;

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const revalidate = 600;
export const dynamicParams = true;

function str(v: string | string[] | undefined) {
  return typeof v === 'string' ? v : undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
  const category = await getCategoryBySlug(slug, locale);
  if (!category) {
    return buildMetadata({
      title: dict.categories.notFound,
      path: `/kategoriler/${slug}`,
      noIndex: true,
      locale,
    });
  }
  return buildMetadata({
    title: category.seoTitle ?? `${category.name} | Bozkır Ağaç Ürünleri`,
    description: category.seoDescription ?? category.description,
    path: `/kategoriler/${category.slug}`,
    image: category.heroImage,
    locale,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug, locale: localeParam }, sp] = await Promise.all([params, searchParams]);
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
  const q = str(sp.q);
  const page = Math.max(1, parseInt(str(sp.sayfa) ?? '1', 10) || 1);

  const [category, all, result] = await Promise.all([
    getCategoryBySlug(slug, locale),
    getCategories(locale),
    getProducts({ category: slug, query: q, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }, locale),
  ]);

  if (!category) notFound();

  const items = result.items;
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const others = all.filter((c) => c.featured && c.slug !== category.slug).slice(0, 4);

  const buildHref = (target: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (target > 1) p.set('sayfa', String(target));
    const qs = p.toString();
    return `/kategoriler/${category.slug}${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              [
                { name: dict.common.home, path: '/' },
                { name: dict.nav.collections, path: '/kategoriler' },
                { name: category.name, path: `/kategoriler/${category.slug}` },
              ],
              locale,
            ),
          ),
        }}
      />
      <PageHero
        eyebrow={dict.nav.collections}
        title={category.name}
        description={category.description}
        crumbs={[
          { label: dict.common.home, href: '/' },
          { label: dict.nav.collections, href: '/kategoriler' },
          { label: category.name },
        ]}
      >
        <div className="mt-10">
          <Suspense fallback={<div className="h-12" />}>
            <CategorySearch />
          </Suspense>
        </div>
      </PageHero>

      <Container className="pb-16">
        <Reveal>
          <div className="relative aspect-[21/9] overflow-hidden rounded-lg bg-surface-2">
            {category.heroImage ? (
              <Image src={category.heroImage} alt={category.name} fill sizes="100vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">{dict.catalog.imagePreparing}</div>
            )}
          </div>
        </Reveal>
      </Container>

      <Container className="pb-24 md:pb-32">
        {items.length > 0 ? (
          <>
            <p className="numerals mb-8 text-sm text-muted">
              {result.total} {dict.catalog.title.toLocaleLowerCase(locale ?? 'tr')}
              {totalPages > 1 ? ` · ${dict.common.page} ${page}/${totalPages}` : ''}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-16 flex items-center justify-between border-t border-border pt-8" aria-label={dict.common.page}>
                {page > 1 ? (
                  <Link href={buildHref(page - 1)} scroll={false} className="inline-flex items-center gap-2 text-sm font-medium">
                    <ArrowLeft className="h-4 w-4" /> {dict.common.prev}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="numerals text-sm text-muted">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link href={buildHref(page + 1)} scroll={false} className="inline-flex items-center gap-2 text-sm font-medium">
                    {dict.common.next} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-10 text-center">
            <p className="text-sm text-muted-strong">{dict.catalog.empty}</p>
            <div className="mt-6 flex justify-center gap-4">
              <ButtonLink href="/teklif-al" variant="outline">
                {dict.common.getQuote}
              </ButtonLink>
              <ButtonLink href="/iletisim">{dict.nav.contact}</ButtonLink>
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="mt-24">
            <p className="text-eyebrow mb-6">{dict.product.related}</p>
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

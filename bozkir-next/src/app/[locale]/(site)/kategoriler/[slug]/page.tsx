import type { Metadata } from 'next';
import Image from 'next/image';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
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
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
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

export default async function CategoryPage({ params }: PageProps) {
  const { slug, locale: localeParam } = await params;
  const localeParamOrNull = localeParam ?? undefined;
  const locale = isLocale(localeParamOrNull) ? localeParamOrNull : undefined;
  const dict = getDictionary(locale ?? 'tr');
  const [category, all, { items }] = await Promise.all([
    getCategoryBySlug(slug, locale),
    getCategories(locale),
    getProducts({ category: slug, limit: 60 }, locale),
  ]);

  if (!category) notFound();

  const others = all.filter((c) => c.featured && c.slug !== category.slug).slice(0, 4);

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
      />

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
              {items.length} {dict.catalog.title.toLocaleLowerCase(locale ?? 'tr')}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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

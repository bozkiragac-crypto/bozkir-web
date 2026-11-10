import { ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ChapterMark } from '@/components/ui/ChapterMark';
import { Reveal } from '@/components/animations/Reveal';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductSpecRail } from '@/components/products/ProductSpecRail';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { getProductsByIds } from '@/lib/api/products';
import { getSiteSettings } from '@/lib/data/settings';
import { buildSpecRail } from '@/lib/product-specs';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Admin'de seçilen ve sıralanan ürünler; seçim yoksa bölüm görünmez. */
export async function FeaturedProducts({ locale }: { locale: Locale }) {
  const settings = await getSiteSettings();
  if (settings.featuredProducts.length === 0) return null;

  const products = await getProductsByIds(settings.featuredProducts, locale);
  if (products.length === 0) return null;

  const dict = await dictForRequest(locale);
  const h = dict.home.featuredProducts;
  const labels = {
    surface: dict.product.surface,
    thickness: dict.product.thickness,
    color: dict.product.colors,
    code: dict.product.productCode,
  };

  return (
    <Container id="urunler" className="pad-band">
      <ChapterMark label={h.eyebrow} className="mb-5" />
      <SectionHeading
        title={h.title}
        body={h.body}
        action={
          <Link
            href="/urunler"
            className="group inline-flex items-center gap-2 text-sm font-medium"
          >
            {h.cta}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      />
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={(i % 4) * 0.05}>
            <div>
              <ProductCard product={product} />
              <ProductSpecRail
                items={buildSpecRail(product, labels)}
                quote={{
                  href: `/teklif-al?urun=${encodeURIComponent(product.slug)}`,
                  label: dict.home.hero.ctaQuote,
                }}
                className="hidden md:flex"
              />
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}

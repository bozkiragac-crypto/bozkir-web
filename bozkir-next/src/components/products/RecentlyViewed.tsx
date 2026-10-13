'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types/product';
import { useRecentlyViewed } from '@/components/providers/RecentlyViewedProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { ProductCard } from '@/components/products/ProductCard';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';

/** "Son görüntülenen" şeridi — en fazla 4 ürün, tam kart olarak. */
export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const { items, ready } = useRecentlyViewed();
  const { t, locale } = useDictionary();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const slugs = items
      .filter((i) => i.slug !== excludeSlug)
      .map((i) => i.slug)
      .slice(0, 4);
    if (slugs.length === 0) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      slugs.map((s) =>
        fetch(`/api/product?slug=${encodeURIComponent(s)}&locale=${locale}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((res) => {
      if (cancelled) return;
      setProducts(res.filter((p): p is Product => !!p && typeof p.slug === 'string'));
    });
    return () => {
      cancelled = true;
    };
  }, [items, excludeSlug, locale]);

  if (!ready || products.length === 0) return null;

  return (
    <Container className="py-24 md:py-32">
      <SectionHeading eyebrow={t('product.recent')} title={t('product.recentTitle')} />
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4 md:gap-y-10">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Container>
  );
}

'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { useRecentlyViewed } from '@/components/providers/RecentlyViewedProvider';
import type { ProductRef } from '@/components/providers/FavoritesProvider';

/** Ürün detay görüntülemesini bir kez izler ve "son görüntülenen"e ekler. */
export function ProductViewTracker({
  slug,
  name,
  category,
  product,
}: {
  slug: string;
  name: string;
  category: string;
  /** Verilirse son görüntülenen listesine eklenir. */
  product?: ProductRef;
}) {
  const { push } = useRecentlyViewed();

  useEffect(() => {
    track('product_view', { slug, name, category });
  }, [slug, name, category]);

  useEffect(() => {
    if (product) push(product);
    // Yalnızca ürün değiştiğinde ekle (nesne kimliği değil, slug).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.slug, push]);

  return null;
}

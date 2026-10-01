'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

/** Ürün detay görüntülemesini bir kez izler (GA4 product_view). */
export function ProductViewTracker({
  slug,
  name,
  category,
}: {
  slug: string;
  name: string;
  category: string;
}) {
  useEffect(() => {
    track('product_view', { slug, name, category });
  }, [slug, name, category]);
  return null;
}

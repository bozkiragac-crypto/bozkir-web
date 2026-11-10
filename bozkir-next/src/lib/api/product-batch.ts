import type { Product } from '@/types/product';

/**
 * Birden çok ürünü tek istekte çözer (favoriler, karşılaştırma, son görülenler).
 * İstek başarısız olursa boş dizi döner; çağıran taraf hafif referanslarla devam eder.
 */
export async function fetchProductBatch(
  slugs: string[],
  locale: string,
  max = 24,
): Promise<Product[]> {
  const unique = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))].slice(0, max);
  if (unique.length === 0) return [];

  const params = new URLSearchParams({ slugs: unique.join(','), locale });
  try {
    const res = await fetch(`/api/products/batch?${params.toString()}`);
    if (!res.ok) return [];
    const data: { items?: Product[] } = await res.json();
    return Array.isArray(data.items)
      ? data.items.filter((p): p is Product => !!p && typeof p.slug === 'string')
      : [];
  } catch {
    return [];
  }
}

import type { Catalog } from '@/types/catalog';
import { fallbackCatalogs } from '@/data/catalogs';
import { apiGet, hasRemoteApi } from './client';

export async function getCatalogs(): Promise<Catalog[]> {
  if (hasRemoteApi()) {
    try {
      const data = await apiGet<Catalog[]>('/catalogs', { revalidate: 600 });
      if (Array.isArray(data) && data.length) return data;
    } catch {
      // sessizce fallback'e düş
    }
  }
  return fallbackCatalogs;
}

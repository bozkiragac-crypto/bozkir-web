'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ProductRef } from '@/components/providers/FavoritesProvider';

const RECENT_KEY = 'bozkir:recent';
const MAX_RECENT = 8;

interface Ctx {
  items: ProductRef[];
  ready: boolean;
  push: (product: ProductRef) => void;
  clear: () => void;
}

const RecentContext = createContext<Ctx | null>(null);

function read(): ProductRef[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is ProductRef =>
        !!p && typeof p === 'object' && typeof (p as ProductRef).slug === 'string',
    );
  } catch {
    return [];
  }
}

/** Son görüntülenen ürünler (localStorage) — en yeni başta, tekilleştirilmiş. */
export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ProductRef[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(items));
    } catch {
      // yok say
    }
  }, [items, ready]);

  const push = useCallback((product: ProductRef) => {
    setItems((prev) =>
      [{ ...product }, ...prev.filter((p) => p.slug !== product.slug)].slice(0, MAX_RECENT),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(() => ({ items, ready, push, clear }), [items, ready, push, clear]);
  return <RecentContext.Provider value={value}>{children}</RecentContext.Provider>;
}

export function useRecentlyViewed(): Ctx {
  const ctx = useContext(RecentContext);
  if (!ctx) throw new Error('useRecentlyViewed, RecentlyViewedProvider içinde kullanılmalı.');
  return ctx;
}

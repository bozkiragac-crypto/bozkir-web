'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/** Favori/karşılaştırma listelerinde saklanan hafif ürün referansı. */
export interface ProductRef {
  id: string;
  slug: string;
  name: string;
  code?: string;
  category: string;
  face?: string;
  image?: string;
}

const FAVORITES_KEY = 'bozkir:favorites';
const COMPARE_KEY = 'bozkir:compare';
const MAX_FAVORITES = 24;
const MAX_COMPARE = 4;

interface Ctx {
  favorites: ProductRef[];
  compare: ProductRef[];
  ready: boolean;
  isFavorite: (slug: string) => boolean;
  inCompare: (slug: string) => boolean;
  toggleFavorite: (product: ProductRef) => void;
  removeFavorite: (slug: string) => void;
  clearFavorites: () => void;
  toggleCompare: (product: ProductRef) => void;
  removeCompare: (slug: string) => void;
  clearCompare: () => void;
}

const FavoritesContext = createContext<Ctx | null>(null);

function read(key: string): ProductRef[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is ProductRef => !!p && typeof p === 'object' && typeof (p as ProductRef).slug === 'string');
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<ProductRef[]>([]);
  const [compare, setCompare] = useState<ProductRef[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(read(FAVORITES_KEY));
    setCompare(read(COMPARE_KEY).slice(0, MAX_COMPARE));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
    document.documentElement.dataset.compare = compare.length > 0 ? '1' : '0';
  }, [compare, ready]);

  useEffect(() => () => {
    document.documentElement.dataset.compare = '0';
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.some((p) => p.slug === slug), [favorites]);
  const inCompare = useCallback((slug: string) => compare.some((p) => p.slug === slug), [compare]);

  const toggleFavorite = useCallback((product: ProductRef) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.slug === product.slug);
      if (exists) return prev.filter((p) => p.slug !== product.slug);
      return [{ ...product }, ...prev].slice(0, MAX_FAVORITES);
    });
  }, []);

  const removeFavorite = useCallback((slug: string) => {
    setFavorites((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const toggleCompare = useCallback((product: ProductRef) => {
    setCompare((prev) => {
      const exists = prev.some((p) => p.slug === product.slug);
      if (exists) return prev.filter((p) => p.slug !== product.slug);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, { ...product }];
    });
  }, []);

  const removeCompare = useCallback((slug: string) => {
    setCompare((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  const clearCompare = useCallback(() => setCompare([]), []);

  const value = useMemo<Ctx>(
    () => ({
      favorites,
      compare,
      ready,
      isFavorite,
      inCompare,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
      toggleCompare,
      removeCompare,
      clearCompare,
    }),
    [favorites, compare, ready, isFavorite, inCompare, toggleFavorite, removeFavorite, clearFavorites, toggleCompare, removeCompare, clearCompare],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites, FavoritesProvider içinde kullanılmalı.');
  return ctx;
}

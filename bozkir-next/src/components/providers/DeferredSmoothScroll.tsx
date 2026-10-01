'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';

type ProviderType = ComponentType<{ children: ReactNode }>;

/**
 * Lenis/GSAP sağlayıcısını tarayıcı boşta kalınca yükler (ilk yükte JS maliyeti düşer).
 * Sağlayıcı yalnızca yan etki çalıştırıp children'ı olduğu gibi döndürdüğü için
 * içerik beklemeden render edilir.
 */
export function DeferredSmoothScroll({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ProviderType | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void import('./SmoothScrollProvider').then((m) => {
        if (!cancelled) setProvider(() => m.SmoothScrollProvider);
      });
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(load, { timeout: 2500 });
    } else {
      const t = setTimeout(load, 1200);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {children}
      {Provider ? <Provider>{null}</Provider> : null}
    </>
  );
}

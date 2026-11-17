'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

// Tailwind'in varsayılan `sm` kırılımı (640px) ile aynı eşik: mobilde
// `sm:hidden` dropdown, 640px ve üstünde `sm:flex` çipleri görünür.
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');

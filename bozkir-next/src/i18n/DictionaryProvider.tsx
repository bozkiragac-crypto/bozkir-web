'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { t } from '@/i18n/translate';

interface DictCtx {
  locale: Locale;
  dict: Dictionary;
  t: (path: string) => string;
  /** `siteConfig.nav` içindeki `key` ile etiket çözer (Ürünler, Kataloglar…). */
  navLabel: (key: string) => string;
}

const DictionaryCtx = createContext<DictCtx | null>(null);

export function DictionaryProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo<DictCtx>(
    () => ({
      locale,
      dict: dictionary,
      t: (path: string) => t(dictionary, path),
      // Parite `tests/unit/dictionaries.test.ts` ile korunur; ayrı TR fallback
      // gönderilmez (aksi halde tüm TR sözlük her sayfaya gömülür).
      navLabel: (key: string) => t(dictionary, `nav.${key}`),
    }),
    [locale, dictionary],
  );
  return <DictionaryCtx.Provider value={value}>{children}</DictionaryCtx.Provider>;
}

export function useDictionary(): DictCtx {
  const ctx = useContext(DictionaryCtx);
  if (!ctx) throw new Error('useDictionary, DictionaryProvider içinde kullanılmalı.');
  return ctx;
}

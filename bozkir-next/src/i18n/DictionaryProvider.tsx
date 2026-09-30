'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { t, dictionaries } from '@/i18n/dictionaries';

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
  const value = useMemo<DictCtx>(() => {
    /** Anahtar yoksa Türkçe karşılığına düşer. */
    const lookup = (key: string) => {
      const path = `nav.${key}`;
      return t(dictionary, path) === path ? t(dictionaries.tr, path) : t(dictionary, path);
    };
    return {
      locale,
      dict: dictionary,
      t: (path: string) => t(dictionary, path),
      navLabel: lookup,
    };
  }, [locale, dictionary]);
  return <DictionaryCtx.Provider value={value}>{children}</DictionaryCtx.Provider>;
}

export function useDictionary(): DictCtx {
  const ctx = useContext(DictionaryCtx);
  if (!ctx) throw new Error('useDictionary, DictionaryProvider içinde kullanılmalı.');
  return ctx;
}

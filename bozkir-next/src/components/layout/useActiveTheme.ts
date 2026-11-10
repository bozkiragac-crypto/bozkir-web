'use client';

import { useSyncExternalStore } from 'react';

export type ActiveTheme = 'light' | 'dark';

/**
 * Kök elemandaki `data-theme` değerini izler.
 * Tema `ThemeToggle` tarafından `<html>` üzerinde değiştirildiği için,
 * bileşenler (ör. Header) tema değişimine anında tepki verir.
 */
function subscribe(onChange: () => void) {
  const root = document.documentElement;
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  return () => {
    observer.disconnect();
  };
}

function getSnapshot(): ActiveTheme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Sunucuda tema bilinmez; ilk boyamada açık tema varsayılır (FOUC betiği düzeltir). */
function getServerSnapshot(): ActiveTheme {
  return 'light';
}

export function useActiveTheme(): ActiveTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

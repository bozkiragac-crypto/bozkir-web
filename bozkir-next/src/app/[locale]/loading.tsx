'use client';

import { useDictionary } from '@/i18n/DictionaryProvider';

export default function Loading() {
  const { dict } = useDictionary();
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[120] h-0.5 overflow-hidden bg-border" aria-hidden>
        <div className="h-full w-1/3 animate-[loading-bar_1.1s_var(--ease-out-expo)_infinite] bg-foreground" />
      </div>
      <div className="flex min-h-svh items-center justify-center pt-[var(--header-height)]">
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 text-sm text-muted"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
          {dict.pages.loading}
        </div>
      </div>
    </>
  );
}

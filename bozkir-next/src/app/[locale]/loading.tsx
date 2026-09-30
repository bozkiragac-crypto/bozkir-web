'use client';

import { useDictionary } from '@/i18n/DictionaryProvider';

export default function Loading() {
  const { dict } = useDictionary();
  return (
    <div className="flex min-h-svh items-center justify-center pt-[var(--header-height)]">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
        {dict.pages.loading}
      </div>
    </div>
  );
}

'use client';

import { Printer } from 'lucide-react';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { cn } from '@/lib/utils';

/** Tarayıcı yazdırma/PDF çıktısı (print CSS ile sadeleşir). */
export function PrintButton({ className }: { className?: string }) {
  const { t } = useDictionary();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-surface-2',
        className,
      )}
    >
      <Printer className="h-4 w-4" /> {t('product.print')}
    </button>
  );
}

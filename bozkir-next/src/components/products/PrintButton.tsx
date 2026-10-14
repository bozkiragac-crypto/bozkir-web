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
      aria-label={t('product.print')}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur transition-colors active:scale-95 hover:border-foreground sm:w-auto sm:gap-2 sm:px-4',
        className,
      )}
    >
      <Printer className="h-4 w-4" />
      <span className="hidden text-sm font-medium sm:inline">{t('product.print')}</span>
    </button>
  );
}

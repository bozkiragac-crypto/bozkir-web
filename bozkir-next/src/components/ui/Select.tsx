import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Native `<select>` sarmalayıcısı: tarayıcı okunu gizler, sağda düzgün hizalı
 * bir `ChevronDown` gösterir (`pe-10` ile metin oka çarpmaz).
 */
export function Select({ className, children, ...rest }: ComponentPropsWithoutRef<'select'>) {
  return (
    <div className={cn('relative inline-block', className)}>
      <select
        {...rest}
        className="h-11 w-full appearance-none rounded-full border border-border bg-transparent ps-4 pe-10 text-base outline-none transition-colors focus-visible:border-foreground sm:text-sm"
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

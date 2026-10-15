import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'size'> {
  /**
   * Görsel biçim: `pill` (public filtreler) veya `rounded` (admin form alanları).
   */
  shape?: 'pill' | 'rounded';
  /** Yükseklik/ölçek: `md` (varsayılan) veya `sm` (kompakt satır içi). */
  size?: 'sm' | 'md';
  /** İç `<select>`'e uygulanacak ek sınıflar (ör. `bg-surface`). */
  selectClassName?: string;
}

/**
 * Native `<select>` sarmalayıcısı: tarayıcı okunu gizler, sağda düzgün ve
 * dikey ortalanmış bir `ChevronDown` gösterir (`pe-10` ile metin oka çarpmaz).
 * Tüm uygulamada tek tip ok hizası için bu bileşen tercih edilir.
 */
export function Select({
  className,
  selectClassName,
  shape = 'pill',
  size = 'md',
  children,
  ...rest
}: SelectProps) {
  const sm = size === 'sm';
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <select
        {...rest}
        className={cn(
          'w-full appearance-none border border-border text-foreground outline-none transition-colors focus-visible:border-foreground disabled:opacity-50',
          sm ? 'h-9 pe-8 ps-3 text-xs' : 'h-11 pe-10 ps-4 text-sm',
          shape === 'pill' ? 'rounded-full' : 'rounded-md',
          selectClassName,
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted',
          sm ? 'end-2 h-3.5 w-3.5' : 'end-3 h-4 w-4',
        )}
      />
    </div>
  );
}

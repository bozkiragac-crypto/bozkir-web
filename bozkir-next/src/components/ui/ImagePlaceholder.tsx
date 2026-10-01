import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Görseli olmayan/kırılan ürünler için ortak yer tutucu. */
export function ImagePlaceholder({
  label,
  className,
  iconClassName,
}: {
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-2 text-muted',
        className,
      )}
    >
      <ImageOff className={cn('h-6 w-6', iconClassName)} aria-hidden />
      {label ? <span className="px-3 text-center text-[0.65rem] tracking-[0.14em] uppercase">{label}</span> : null}
    </div>
  );
}

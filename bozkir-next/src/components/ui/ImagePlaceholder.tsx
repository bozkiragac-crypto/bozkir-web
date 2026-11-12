import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Görseli olmayan/kırılan ürünler için ortak yer tutucu.
 * Düz gri kutu yerine ince bir malzeme dokusu + rozet kullanır; ürün kartı ve
 * karşılaştırma tablosunda "boş/kırık" izlenimi vermez.
 */
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
        'relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-surface-2 text-muted',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, var(--border) 0 1px, transparent 1px 16px)',
        }}
      />
      <span
        aria-hidden
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 backdrop-blur-sm"
      >
        <ImageOff className={cn('h-5 w-5', iconClassName)} />
      </span>
      {label ? (
        <span className="relative max-w-[85%] px-3 text-center text-[0.7rem] leading-relaxed tracking-[0.14em] uppercase">
          {label}
        </span>
      ) : null}
    </div>
  );
}

import { ArrowUpRight } from 'lucide-react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { cn } from '@/lib/utils';
import type { SpecItem } from '@/lib/product-specs';

/**
 * Ürün kartının altındaki teknik ray: yüzey / kalınlık / renk / kod.
 * Toptan alıcı için özet bilgi, kartın hover'ına bağlı değildir.
 */
export function ProductSpecRail({
  items,
  quote,
  className,
}: {
  items: SpecItem[];
  quote?: { href: string; label: string };
  className?: string;
}) {
  if (items.length === 0 && !quote) return null;

  return (
    <div className={cn('mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.length > 0 && (
        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.75rem]">
          {items.map((item) => (
            <div key={item.key} className="flex items-baseline gap-1.5">
              <dt className="tracking-[0.12em] text-muted uppercase">{item.label}</dt>
              <dd className="text-muted-strong">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {quote && (
        <Link
          href={quote.href}
          className="tap-target ms-auto inline-flex items-center gap-1 text-[0.75rem] font-medium text-accent transition-colors hover:text-foreground"
        >
          {quote.label}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** İnce çizgili panel ızgarası: hücreler arası 1px ayırıcı, tek çerçeve/radius. */
export function PanelGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-border bg-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

const surface = 'flex flex-col bg-surface';

/** Tek panel hücresi (yüzey). */
export function Panel({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn(surface, className)} {...rest}>
      {children}
    </div>
  );
}

/** Bağlantılı panel hücresi — aynı yüzey, hover durumu çağırana bırakılır. */
export function PanelLink({
  href,
  className,
  children,
  ...rest
}: { href: string; className?: string; children: ReactNode } & Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'href' | 'className' | 'children'
>) {
  return (
    <Link href={href} className={cn(surface, className)} {...rest}>
      {children}
    </Link>
  );
}

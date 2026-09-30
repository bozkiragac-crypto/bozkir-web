import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'solid' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'group inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-[transform,background-color,color,border-color] duration-300 ease-[var(--ease-out-expo)] active:scale-[0.985]';

const variants: Record<Variant, string> = {
  solid: 'bg-foreground text-background hover:-translate-y-0.5',
  outline: 'border border-border-strong text-foreground hover:-translate-y-0.5 hover:bg-foreground hover:text-background',
  ghost: 'text-foreground hover:bg-surface-2',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-[0.95rem]',
};

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({
  variant = 'solid',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'solid',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'className' | 'children'>) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Dikey boşluk ölçeği */
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'py-16 md:py-24',
  md: 'py-24 md:py-32',
  lg: 'py-32 md:py-48',
} as const;

export function Section({ id, className, children, size = 'md' }: SectionProps) {
  return (
    <section id={id} className={cn(sizes[size], className)}>
      {children}
    </section>
  );
}

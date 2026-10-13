import { createElement, type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** Sayfa geneli yatay standart: `container-x` + tek `--gutter` kaynağı. */
export function Container({ as = 'div', className, children, ...rest }: ContainerProps) {
  return createElement(as, { className: cn('container-x', className), ...rest }, children);
}

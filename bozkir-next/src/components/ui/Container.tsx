import { createElement, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function Container({ as = 'div', className, children }: ContainerProps) {
  return createElement(as, { className: cn('container-x', className) }, children);
}

'use client';

import { track, type AnalyticsEvent } from '@/lib/analytics';

/** tel:/wa.me bağlantılarında dönüşüm olayı gönderen basit bağlantı. */
export function TrackedLink({
  href,
  event,
  source,
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  event: AnalyticsEvent;
  source: string;
}) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={className}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={() => track(event, { source })}
      {...rest}
    >
      {children}
    </a>
  );
}

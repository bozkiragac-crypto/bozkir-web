'use client';

import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/**
 * Ürün detayındaki "numune iste" bağlantısı. WhatsApp yeni sekmede açılırken
 * sayfada kısa süreli, ekran okuyucuların da duyacağı bir geri bildirim verir.
 */
export function SampleRequestLink({
  href,
  label,
  openingLabel,
  productSlug,
}: {
  href: string;
  label: string;
  openingLabel: string;
  productSlug?: string;
}) {
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => setOpening(false), 6000);
    return () => window.clearTimeout(timer);
  }, [opening]);

  return (
    <div className="no-print mt-5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          setOpening(true);
          track('sample_request', { product: productSlug });
        }}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-strong transition-colors hover:text-foreground"
      >
        <Package className="h-4 w-4" /> {label}
      </a>
      <span
        role="status"
        aria-live="polite"
        className={cn('block text-xs text-muted-strong', opening ? 'mt-2' : 'sr-only')}
      >
        {opening ? openingLabel : ''}
      </span>
    </div>
  );
}

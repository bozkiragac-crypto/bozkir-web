'use client';

import { track } from '@/lib/analytics';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

/** WhatsApp FAB için tıklama takibi yapan client link. */
export function WhatsAppFabLink({
  href,
  ariaLabel,
  cursor,
  label,
  className,
}: {
  href: string;
  ariaLabel: string;
  cursor: string;
  label: string;
  className: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      data-whatsapp-fab
      data-cursor-label={cursor}
      onClick={() => track('whatsapp_click', { source: 'fab' })}
      className={className}
    >
      <span className="flex h-14 w-14 items-center justify-center">
        <WhatsAppIcon className="h-7 w-7" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 group-hover:max-w-[10rem] group-focus-visible:max-w-[10rem]">
        {label}
      </span>
    </a>
  );
}

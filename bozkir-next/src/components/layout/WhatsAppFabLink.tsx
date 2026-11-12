'use client';

import { track } from '@/lib/analytics';
import { useConsent } from '@/components/consent/ConsentProvider';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

/** WhatsApp FAB için tıklama takibi yapan client link. */
export function WhatsAppFabLink({
  href,
  ariaLabel,
  label,
  className,
}: {
  href: string;
  ariaLabel: string;
  label: string;
  className: string;
}) {
  const { consent, ready } = useConsent();

  // Çerez bandı (z-140) butonun (z-120) tam üstüne biniyordu: karar verilene
  // kadar FAB gizlenir, bant kapandığında geri gelir.
  if (!ready || consent === 'unset') return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      data-whatsapp-fab
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

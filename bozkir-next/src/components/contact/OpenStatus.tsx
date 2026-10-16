'use client';

import { useEffect, useState } from 'react';
import { isOpenAt, type WeeklyHours } from '@/lib/open-hours';
import { cn } from '@/lib/utils';

/** Yapılandırılmış saatlere göre canlı "açık/kapalı" rozeti (dakikada bir güncellenir). */
export function OpenStatus({
  schedule,
  timeZone,
  openLabel,
  closedLabel,
  className,
}: {
  schedule: WeeklyHours;
  timeZone: string;
  openLabel: string;
  closedLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const tick = () => setOpen(isOpenAt(schedule, new Date(), timeZone));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [schedule, timeZone]);

  // SSR/hydration uyuşmazlığını önle: istemcide hesaplanana kadar gösterme.
  if (open === null) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs',
        open ? 'text-success' : 'text-muted-strong',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {open ? openLabel : closedLabel}
    </span>
  );
}

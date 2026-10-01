'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ArrowRight } from 'lucide-react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useRef } from 'react';

const STORAGE_KEY = 'bozkir:popup:seen';

export interface PopupCampaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
}

/** Girişte bir kez gösterilen kampanya modalı (günde 1, kapatınca hatırlar). */
export function CampaignPopup({ campaign, readMore }: { campaign: PopupCampaign; readMore: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      if (seen === `${campaign.id}:${today}`) return;
    } catch {
      // localStorage yok → göster
    }
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [campaign.id]);

  function close() {
    setOpen(false);
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(STORAGE_KEY, `${campaign.id}:${today}`);
    } catch {
      // yok say
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div ref={ref} className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label={readMore ? 'Kapat' : 'Close'}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur transition hover:bg-surface-2"
        >
          <X className="h-4 w-4" />
        </button>

        {campaign.imageUrl && (
          <div className="relative aspect-[16/9] w-full bg-surface-2">
            <Image src={campaign.imageUrl} alt={campaign.title} fill sizes="(max-width: 768px) 100vw, 512px" className="object-cover" />
          </div>
        )}

        <div className="p-7">
          <h3 className="text-xl font-medium tracking-tight md:text-2xl">{campaign.title}</h3>
          {campaign.description && <p className="mt-3 text-sm leading-relaxed text-muted-strong">{campaign.description}</p>}
          {campaign.linkUrl && (
            <Link
              href={campaign.linkUrl}
              onClick={close}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {campaign.linkLabel || readMore} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

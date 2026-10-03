'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X, ArrowRight, Megaphone } from 'lucide-react';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
export function CampaignPopup({
  campaign,
  readMore,
  eyebrow,
  closeLabel,
}: {
  campaign: PopupCampaign;
  readMore: string;
  eyebrow: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
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
    const timer = setTimeout(() => setOpen(true), 800);
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
    if (!open) {
      setShown(false);
      return;
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const hasImage = Boolean(campaign.imageUrl);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-popup-title"
      aria-describedby={campaign.description ? 'campaign-popup-desc' : undefined}
      data-testid="campaign-popup"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={ref}
        className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 ease-out ${
          shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.97] opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={close}
          aria-label={closeLabel}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-surface-2"
        >
          <X className="h-4 w-4" />
        </button>

        {hasImage ? (
          <div className="relative aspect-[16/9] w-full bg-surface-2">
            <Image
              src={campaign.imageUrl}
              alt={campaign.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.15)_0%,rgba(10,10,12,0.05)_55%,rgba(10,10,12,0.55)_100%)]"
              aria-hidden
            />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur">
              <Megaphone className="h-3 w-3" /> {eyebrow}
            </span>
          </div>
        ) : (
          <div
            className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-[#141416]"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_18%_0%,rgba(141,132,116,0.5),rgba(20,20,22,0)_60%),radial-gradient(120%_120%_at_100%_100%,rgba(179,169,143,0.35),rgba(20,20,22,0)_55%)]" />
            <div className="relative flex flex-col items-center gap-3 text-white/90">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
                <Megaphone className="h-7 w-7" />
              </span>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/70">{eyebrow}</span>
            </div>
          </div>
        )}

        <div className="p-6 md:p-8">
          <h3 id="campaign-popup-title" className="text-2xl font-medium tracking-tight md:text-3xl">
            {campaign.title}
          </h3>
          {campaign.description && (
            <p id="campaign-popup-desc" className="mt-3 text-sm leading-relaxed text-muted-strong md:text-base">
              {campaign.description}
            </p>
          )}
          {campaign.linkUrl && (
            <Link
              href={campaign.linkUrl}
              onClick={close}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:w-auto"
            >
              {campaign.linkLabel || readMore} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

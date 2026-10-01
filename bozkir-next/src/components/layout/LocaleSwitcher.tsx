'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Check, Globe } from 'lucide-react';
import { localeLabels, locales, switchLocaleInPath, type Locale } from '@/i18n/config';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { cn } from '@/lib/utils';

/** Header/footer dil seçici: mevcut adresi koruyarak dil değiştirir. */
export function LocaleSwitcher({
  onDark = false,
  compact = false,
  className,
}: {
  onDark?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const { locale, t } = useDictionary();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `bozkir_locale=${next};path=/;max-age=31536000;samesite=lax`;
    router.push(switchLocaleInPath(pathname, next));
    router.refresh();
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('common.language')}
        className={cn(
          'flex h-11 items-center gap-2 rounded-full px-3 transition-colors',
          onDark ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-surface-2',
        )}
      >
        <Globe className="h-[18px] w-[18px]" />
        {!compact && <span className="text-xs font-medium uppercase">{locale}</span>}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full end-0 z-[110] mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => pick(l)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-surface-2"
              >
                <span>
                  <span className="block">{localeLabels[l].native}</span>
                  <span className="block text-xs text-muted">{localeLabels[l].english}</span>
                </span>
                {l === locale && <Check className="h-4 w-4 flex-none" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

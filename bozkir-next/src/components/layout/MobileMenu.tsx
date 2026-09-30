'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Category } from '@/types/category';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function MobileMenu({ open, onClose, categories }: MobileMenuProps) {
  const { t, navLabel } = useDictionary();

  // Açıkken arka plan kaymasın.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-background pb-[var(--safe-bottom)] transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] xl:hidden',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
      aria-hidden={!open}
      // Kapalıyken içeriği klavye/AT erişiminden tamamen çıkar.
      inert={!open}
    >
      <div className="flex h-[var(--header-height)] items-center justify-between px-5">
        <span className="text-sm font-semibold tracking-[0.18em] uppercase">{siteConfig.name}</span>
        <button onClick={onClose} aria-label={t('nav.close')} className="p-2">
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex flex-col px-5 pt-6">
        {siteConfig.nav.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClose}
            className="border-b border-border py-4 text-2xl font-medium tracking-tight"
          >
            {navLabel(item.key)}
          </Link>
        ))}
      </nav>

      <div className="px-5 pt-8">
        <p className="text-eyebrow mb-4">{t('nav.featuredProducts')}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-strong">
          {categories
            .filter((c) => c.featured)
            .slice(0, 8)
            .map((c) => (
              <Link key={c.id} href={`/kategoriler/${c.slug}`} onClick={onClose} className="py-1.5">
                {c.name}
              </Link>
            ))}
        </div>
      </div>

      <div className="px-5 pt-10">
        <Link
          href="/teklif-al"
          onClick={onClose}
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-foreground text-background"
        >
          {t('nav.quote')}
        </Link>
      </div>
    </div>
  );
}

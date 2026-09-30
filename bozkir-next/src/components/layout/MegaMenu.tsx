'use client';

import { SmartImage as Image } from '@/components/ui/SmartImage';
import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/types/category';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

interface MegaMenuProps {
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function MegaMenu({ categories, open, onClose, onPointerEnter, onPointerLeave }: MegaMenuProps) {
  const { t } = useDictionary();
  const items = categories.filter((c) => c.featured);
  const [active, setActive] = useState(0);
  const activeCategory = items[active];

  return (
    <div
      id="mega-menu"
      aria-hidden={!open}
      inert={!open}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      className={cn(
        'absolute inset-x-0 top-full hidden border-t border-border bg-background/95 backdrop-blur-xl transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] xl:block',
        open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
      )}
    >
      <div className="container-x grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-16 py-12">
        <div>
          <p className="text-eyebrow mb-6">{t('nav.products')}</p>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
            {items.map((category, i) => (
              <li key={category.id}>
                <Link
                  href={`/kategoriler/${category.slug}`}
                  className={cn(
                    'group flex items-center justify-between border-b border-border py-3 text-[0.95rem] transition-colors',
                    i === active ? 'text-foreground' : 'text-muted-strong hover:text-foreground',
                  )}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={onClose}
                >
                  <span>{category.name}</span>
                  <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/urunler"
            onClick={onClose}
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground"
          >
            {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-surface-2">
          {activeCategory?.heroImage ? (
            <Image
              key={activeCategory.id}
              src={activeCategory.heroImage}
              alt={activeCategory.name}
              width={760}
              height={520}
              className="h-[320px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[320px] w-full items-center justify-center bg-surface-2 text-sm text-muted">
              {t('catalog.imagePreparing')}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <p className="text-lg font-medium text-white">{activeCategory?.name}</p>
            <p className="mt-1 max-w-md text-sm text-white/75">{activeCategory?.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

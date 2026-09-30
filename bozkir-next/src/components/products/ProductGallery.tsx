'use client';

import { useState } from 'react';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useDictionary();
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const current = images[active];
  const showPlaceholder = !current || broken[active];

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-surface-2 text-sm text-muted">
        {t('catalog.imagePreparing')}
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-2">
        {!showPlaceholder ? (
          <SmartImage
            key={current}
            src={current}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            onError={() => setBroken((b) => ({ ...b, [active]: true }))}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">{t('catalog.imagePreparing')}</div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {images.map((url, i) => (
            <li key={`${url}-${i}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${i + 1} / ${images.length}`}
                aria-current={i === active}
                className={cn(
                  'relative block h-20 w-20 overflow-hidden rounded-md border bg-surface-2 transition-colors',
                  i === active ? 'border-foreground' : 'border-border hover:border-border-strong',
                )}
              >
                {!broken[i] ? (
                  <SmartImage
                    src={url}
                    alt=""
                    fill
                    sizes="80px"
                    onError={() => setBroken((b) => ({ ...b, [i]: true }))}
                    className="object-cover"
                  />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

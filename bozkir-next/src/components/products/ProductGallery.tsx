'use client';

import { useState } from 'react';
import { Expand } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { ImageLightbox, type LightboxItem } from '@/components/ui/ImageLightbox';
import { cn } from '@/lib/utils';
import { useDictionary } from '@/i18n/DictionaryProvider';

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useDictionary();
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);
  const current = images[active];
  const showPlaceholder = !current || broken[active];

  if (!images.length) {
    return (
      <div className="aspect-square overflow-hidden rounded-lg">
        <ImagePlaceholder label={t('catalog.imagePreparing')} />
      </div>
    );
  }

  const lightboxItems: LightboxItem[] = images.map((url, i) => ({ url, alt: `${alt} — ${i + 1}` }));

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-lg bg-surface-2">
        {!showPlaceholder ? (
          <>
            <SmartImage
              key={current}
              src={current}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              onError={() => setBroken((b) => ({ ...b, [active]: true }))}
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setLightbox(active)}
              aria-label={t('home.gallery.expand')}
              className="absolute end-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/85 text-foreground opacity-100 backdrop-blur transition hover:border-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <Expand className="h-4 w-4" />
            </button>
          </>
        ) : (
          <ImagePlaceholder label={t('catalog.imagePreparing')} />
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
                ) : (
                  <ImagePlaceholder iconClassName="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <ImageLightbox
        items={lightboxItems}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
      />
    </div>
  );
}

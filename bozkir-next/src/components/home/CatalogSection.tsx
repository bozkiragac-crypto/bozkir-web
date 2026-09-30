import Image from 'next/image';
import { FileText } from 'lucide-react';
import { getCatalogs } from '@/lib/api/catalogs';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { CatalogActions } from '@/components/catalog/CatalogActions';
import { dictFor } from '@/i18n/server';
import type { Locale } from '@/i18n/config';
import type { Catalog } from '@/types/catalog';

function Cover({ catalog, placeholder }: { catalog: Catalog; placeholder: string }) {
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-surface-2">
      {catalog.cover ? (
        <Image src={catalog.cover} alt={catalog.title} fill sizes="(max-width: 768px) 80vw, 320px" className="object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-muted">
          <FileText className="h-10 w-10" />
          <span className="text-xs tracking-[0.16em] uppercase">{placeholder}</span>
        </div>
      )}
      <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] tracking-[0.16em] text-white uppercase">
        PDF
      </span>
    </div>
  );
}

export async function CatalogSection({ locale }: { locale: Locale }) {
  const dict = dictFor(locale);
  const h = dict.home.catalog;
  const catalogs = await getCatalogs(locale);

  if (catalogs.length === 0) return null;

  const [featured, ...rest] = catalogs;

  return (
    <Container className="py-24 md:py-32">
      {featured && (
        <Reveal>
          <div className="grid items-center gap-12 rounded-xl border border-border bg-surface p-8 md:grid-cols-[1fr_1.2fr] md:p-14">
            <Cover catalog={featured} placeholder={h.placeholder} />
            <div>
              <p className="text-eyebrow">{h.eyebrow}</p>
              <h2 className="text-headline mt-4">{featured.title}</h2>
              <p className="mt-5 max-w-lg leading-relaxed text-muted-strong">{featured.description}</p>
              <div className="mt-8">
                <CatalogActions catalog={featured} />
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {rest.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((catalog) => (
            <Reveal key={catalog.id}>
              <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-6">
                <div className="relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-lg bg-surface-2">
                  {catalog.cover ? (
                    <Image src={catalog.cover} alt={catalog.title} fill sizes="160px" className="object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
                      <FileText className="h-8 w-8" />
                      <span className="text-[0.65rem] tracking-[0.16em] uppercase">{h.placeholder}</span>
                    </div>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{catalog.title}</h3>
                {catalog.description && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-strong">{catalog.description}</p>}
                <div className="mt-5">
                  <CatalogActions catalog={catalog} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </Container>
  );
}

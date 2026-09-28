import Image from 'next/image';
import { FileText } from 'lucide-react';
import { getCatalogs } from '@/lib/api/catalogs';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';
import { CatalogActions } from '@/components/catalog/CatalogActions';

export async function CatalogSection() {
  const catalogs = await getCatalogs();
  const catalog = catalogs[0];

  if (!catalog) return null;

  return (
    <Container className="py-24 md:py-32">
      <Reveal>
        <div className="grid items-center gap-12 rounded-xl border border-border bg-surface p-8 md:grid-cols-[1fr_1.2fr] md:p-14">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-surface-2">
            {catalog.cover ? (
              <Image
                src={catalog.cover}
                alt={catalog.title}
                fill
                sizes="(max-width: 768px) 80vw, 320px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-muted">
                <FileText className="h-10 w-10" />
                <span className="text-xs tracking-[0.16em] uppercase">Katalog</span>
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] tracking-[0.16em] text-white uppercase">
              PDF
            </span>
          </div>

          <div>
            <p className="text-eyebrow">Katalog</p>
            <h2 className="text-headline mt-4">{catalog.title}</h2>
            <p className="mt-5 max-w-lg leading-relaxed text-muted-strong">{catalog.description}</p>
            <div className="mt-8">
              <CatalogActions catalog={catalog} />
            </div>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}

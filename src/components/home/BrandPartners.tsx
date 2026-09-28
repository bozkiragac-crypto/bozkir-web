import Image from 'next/image';
import type { Brand } from '@/types/brand';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/animations/Reveal';

interface BrandPartnersProps {
  brands: Brand[];
}

export function BrandPartners({ brands }: BrandPartnersProps) {
  return (
    <Container className="py-24 md:py-32">
      <Reveal>
        <p className="text-eyebrow">Çalıştığımız Markalar</p>
        <h2 className="text-headline mt-4 max-w-2xl">Yetkili bayilikler ve güçlü tedarik ağı.</h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3 lg:grid-cols-5">
        {brands.map((brand) => {
          const content = (
            <>
              <Image
                src={brand.logo}
                alt={brand.name}
                width={brand.width ?? 140}
                height={brand.height ?? 56}
                className="h-12 w-auto object-contain opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
              />
              <div>
                <p className="text-sm font-medium">{brand.name}</p>
                {brand.category && <p className="mt-1 text-xs text-muted">{brand.category}</p>}
              </div>
            </>
          );

          const className =
            'group flex min-h-[180px] flex-col items-center justify-center gap-5 bg-surface p-8 text-center transition-colors hover:bg-surface-2';

          // URL yoksa bağlantı değil, düz kart olarak göster.
          return brand.url ? (
            <a key={brand.id} href={brand.url} target="_blank" rel="noopener noreferrer" className={className}>
              {content}
            </a>
          ) : (
            <div key={brand.id} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </Container>
  );
}

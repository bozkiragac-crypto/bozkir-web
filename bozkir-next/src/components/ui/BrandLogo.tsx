import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Marka logosu (şeffaf PNG). Boyut `className` ile verilir (ör. `h-8`).
 * `onDark` koyu zeminlerde ince gölge ekler (yeşil logo okunurluğu).
 */
export function BrandLogo({
  className,
  priority = false,
  onDark = false,
  alt = 'Bozkır Ağaç Ürünleri',
  src = '/images/bozkir-agac-logo.png',
}: {
  className?: string;
  priority?: boolean;
  onDark?: boolean;
  alt?: string;
  /** Admin'den yüklenen logo URL'si. */
  src?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1062}
      height={920}
      priority={priority}
      unoptimized={src.startsWith('http')}
      sizes="(max-width: 768px) 160px, 260px"
      className={cn(
        'w-auto object-contain',
        onDark && 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
        className,
      )}
    />
  );
}

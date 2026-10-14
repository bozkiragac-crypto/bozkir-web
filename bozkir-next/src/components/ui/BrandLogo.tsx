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
}: {
  className?: string;
  priority?: boolean;
  onDark?: boolean;
  alt?: string;
}) {
  return (
    <Image
      src="/images/bozkir-agac-logo.png"
      alt={alt}
      width={1062}
      height={920}
      priority={priority}
      sizes="(max-width: 768px) 160px, 260px"
      className={cn(
        'w-auto object-contain',
        onDark && 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
        className,
      )}
    />
  );
}

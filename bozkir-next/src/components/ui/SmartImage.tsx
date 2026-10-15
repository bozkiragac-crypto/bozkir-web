import NextImage, { type ImageProps } from 'next/image';
import { blurDataURL } from '@/lib/image';

/**
 * next/image sarmalayıcısı: yalnızca üretilmiş blur verisi (`blur.json`) olan
 * yerel görsellerde blur placeholder uygular. Diğer görsellerde (ör. /media/...
 * ürün görselleri) placeholder kullanılmaz — aksi halde geçersiz bir blur verisi
 * bozuk-görsel parlamasına yol açabiliyordu.
 */
export function SmartImage({ src, ...rest }: ImageProps) {
  const blur = typeof src === 'string' ? blurDataURL(src) : undefined;
  return blur ? (
    <NextImage src={src} placeholder="blur" blurDataURL={blur} {...rest} />
  ) : (
    <NextImage src={src} {...rest} />
  );
}

import NextImage, { type ImageProps } from 'next/image';
import { blurDataURL } from '@/lib/image';

/**
 * next/image sarmalayıcısı: yerel görsellerde blur placeholder'ı otomatik uygular.
 * Uzak görsellerde (API) placeholder boş kalır (nötr zemin korunur).
 */
export function SmartImage({ src, ...rest }: ImageProps) {
  const blur = typeof src === 'string' ? blurDataURL(src) : undefined;
  return <NextImage src={src} {...(blur ? { placeholder: 'blur', blurDataURL: blur } : {})} {...rest} />;
}

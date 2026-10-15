import NextImage, { type ImageProps } from 'next/image';
import { blurDataURL } from '@/lib/image';

/**
 * Sitedeki nötr blur placeholder (1x1 açık gri PNG). `blur.json`'da üretilmiş
 * blur verisi olmayan görseller (ör. /media/... ürün görselleri) için kullanılır;
 * böylece görsel yüklenene kadar boş zemin yerine yumuşak bir placeholder görünür.
 */
const NEUTRAL_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/**
 * next/image sarmalayıcısı: blur placeholder'ı otomatik uygular.
 * - Yerel görsellerde üretilmiş (`blur.json`) blur kullanılır.
 * - Diğerlerinde (uzak / medya) nötr gri blur fallback uygulanır.
 */
export function SmartImage({ src, ...rest }: ImageProps) {
  const blur = (typeof src === 'string' && blurDataURL(src)) || NEUTRAL_BLUR;
  return <NextImage src={src} placeholder="blur" blurDataURL={blur} {...rest} />;
}

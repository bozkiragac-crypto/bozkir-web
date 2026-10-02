import sharp from 'sharp';

export interface OptimizedImage {
  buffer: Buffer;
  contentType: string;
  ext: string;
  /** Dönüşüm gerçekleşti mi? false ise orijinal format korundu. */
  converted: boolean;
}

/**
 * Yüklenen görseli optimize eder: en fazla `maxWidth` genişliğe küçültür ve
 * **her zaman** WebP'ye çevirir (JPEG yüklense bile).
 *
 * Dönüşüm yalnızca sharp hata verirse atlanır — bu durumda orijinal byte'lar
 * döner ama hata konsola yazılır; aksi halde "WebP'ye çevriliyordu, çevrilmedi"
 * gibi sessiz bir arıza üretir.
 */
export async function optimizeImage(
  input: Buffer,
  originalType: string,
  maxWidth = 2000,
): Promise<OptimizedImage> {
  const fallback: OptimizedImage = {
    buffer: input,
    contentType: originalType || 'image/jpeg',
    ext: extFromType(originalType),
    converted: false,
  };

  try {
    const image = sharp(input, { failOn: 'none' });
    const meta = await image.metadata();
    const pipeline =
      meta.width && meta.width > maxWidth ? image.resize({ width: maxWidth, withoutEnlargement: true }) : image;
    const buffer = await pipeline.webp({ quality: 82 }).toBuffer();

    // Boyut avantajı yoksa bile WebP kullanılır: format talebi ve CDN tutarlılığı
    // için asıl olan bu, dosya boyutu değil.
    return { buffer, contentType: 'image/webp', ext: 'webp', converted: true };
  } catch (err) {
    // Sessizce yutmak, panelde "neden JPEG kaldı?" diye sorulmasına yol açar.
    console.error('[image-optimize] WebP dönüşümü başarısız, orijinal saklanıyor:', err);
    return fallback;
  }
}

function extFromType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/avif') return 'avif';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}
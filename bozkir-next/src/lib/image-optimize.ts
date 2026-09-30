import sharp from 'sharp';

export interface OptimizedImage {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

/**
 * Yüklenen görseli optimize eder: en fazla `maxWidth` genişliğe küçültür ve
 * WebP'ye çevirir. Başarısız olursa orijinali döndürür (yükleme engellenmez).
 */
export async function optimizeImage(
  input: Buffer,
  originalType: string,
  maxWidth = 2000,
): Promise<OptimizedImage> {
  try {
    const image = sharp(input, { failOn: 'none' });
    const meta = await image.metadata();
    const pipeline = meta.width && meta.width > maxWidth ? image.resize({ width: maxWidth, withoutEnlargement: true }) : image;
    const buffer = await pipeline.webp({ quality: 82 }).toBuffer();
    // Dönüşüm anlamlı kazanç sağlıyorsa WebP kullan.
    if (buffer.length < input.length * 1.05) {
      return { buffer, contentType: 'image/webp', ext: 'webp' };
    }
    return { buffer: input, contentType: originalType || 'image/jpeg', ext: extFromType(originalType) };
  } catch {
    return { buffer: input, contentType: originalType || 'image/jpeg', ext: extFromType(originalType) };
  }
}

function extFromType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/avif') return 'avif';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

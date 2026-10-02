import sharp from 'sharp';

/**
 * Uzak görseli `ImageResponse` için JPEG data URL'e çevirir.
 *
 * Neden JPEG: Satori/next-og WebP'yi çözemiyor ("u2 is not iterable") ve
 * yüklenen tüm görseller WebP'ye dönüştürülüyor. sharp ile 1200x630 cover
 * JPEG üretilerek hem format sorunu çözülür hem görsel küçülür.
 */
export async function remoteImageToJpegDataUrl(
  url: string,
  width: number,
  height: number,
): Promise<string | null> {
  if (!url || url.startsWith('data:')) return url || null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await sharp(buf)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString('base64')}`;
  } catch {
    return null;
  }
}

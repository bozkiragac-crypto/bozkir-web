import { describe, it, expect } from 'vitest';
import { optimizeImage } from '@/lib/image-optimize';
import sharp from 'sharp';

describe('image-optimize', () => {
  it('büyük görseli küçültür ve WebP döndürür', async () => {
    const input = await sharp({
      create: { width: 3000, height: 3000, channels: 3, background: { r: 200, g: 180, b: 160 } },
    })
      .jpeg()
      .toBuffer();
    const result = await optimizeImage(input, 'image/jpeg', 2000);
    expect(result.contentType).toBe('image/webp');
    expect(result.ext).toBe('webp');
    expect(result.buffer.length).toBeLessThan(input.length);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(2000);
    expect(meta.format).toBe('webp');
  });

  it('küçük görseli büyütmez (withoutEnlargement)', async () => {
    const input = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 100, g: 100, b: 100 } },
    })
      .jpeg()
      .toBuffer();
    const result = await optimizeImage(input, 'image/jpeg', 2000);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(400);
  });

  it('bozuk girdide orijinali döndürür (hata fırlatmaz)', async () => {
    const input = Buffer.from('bu bir görsel değil');
    const result = await optimizeImage(input, 'image/jpeg', 2000);
    expect(result.buffer.equals(input)).toBe(true);
    expect(result.contentType).toBe('image/jpeg');
  });
});

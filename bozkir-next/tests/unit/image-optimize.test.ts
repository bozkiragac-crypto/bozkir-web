import { describe, it, expect } from 'vitest';
import { optimizeImage } from '@/lib/image-optimize';
import { validateImageSignature } from '@/lib/media';
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
    expect(result.converted).toBe(false);
  });

  it('WebP boyutu büyükse bile JPEG olarak kalmaz (koşulsuz dönüşüm)', async () => {
    // Düz renkli PNG: WebP çıktısı orijinalden büyük olabilir. Yine de dönüşür.
    const input = await sharp({
      create: { width: 300, height: 300, channels: 4, background: { r: 10, g: 120, b: 200, alpha: 0.5 } },
    })
      .png()
      .toBuffer();
    const result = await optimizeImage(input, 'image/png', 2000);
    expect(result.converted).toBe(true);
    expect(result.contentType).toBe('image/webp');
    expect(result.ext).toBe('webp');
    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe('webp');
  });

  it('başarılı dönüşümde converted=true işaretler', async () => {
    const input = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 200, g: 180, b: 160 } },
    })
      .jpeg()
      .toBuffer();
    const result = await optimizeImage(input, 'image/jpeg', 2000);
    expect(result.converted).toBe(true);
  });
});

describe('validateImageSignature', () => {
  it('gerçek JPEG/PNG/WebP imzalarını kabul eder', async () => {
    for (const format of ['jpeg', 'png', 'webp'] as const) {
      const buf = Buffer.from(
        await sharp({ create: { width: 4, height: 4, channels: 3, background: '#fff' } })
          .toFormat(format)
          .toBuffer(),
      );
      expect(validateImageSignature(buf.subarray(0, 16))).toBeNull();
    }
  });

  it('PDF ve düz metni reddeder', () => {
    expect(validateImageSignature(Buffer.from('%PDF-1.7 ...'))).toBeTruthy();
    expect(validateImageSignature(Buffer.from('hello world, not an image'))).toBeTruthy();
  });
});

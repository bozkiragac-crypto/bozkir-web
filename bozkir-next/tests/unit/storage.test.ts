import { describe, it, expect } from 'vitest';
import { publicUrl, objectKeyFromUrl, toObjectKey, isOwnStorageUrl } from '@/lib/storage/s3';

describe('s3 publicUrl', () => {
  it('düz anahtarı /media tabanına ekler', () => {
    expect(publicUrl('products/x.webp')).toBe('/media/products/x.webp');
  });

  it("mutlak/kök-göreli/data URL'lere dokunmaz", () => {
    expect(publicUrl('http://host/x')).toBe('http://host/x');
    expect(publicUrl('/root/x')).toBe('/root/x');
    expect(publicUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
  });

  it('boş değer boş döner', () => {
    expect(publicUrl('')).toBe('');
    expect(publicUrl('   ')).toBe('');
  });
});

describe('s3 objectKeyFromUrl / toObjectKey', () => {
  it('/media yolundan anahtar çıkarır', () => {
    expect(objectKeyFromUrl('/media/products/x.webp')).toBe('products/x.webp');
  });

  it('harici url için null', () => {
    expect(objectKeyFromUrl('http://random.example/x.webp')).toBeNull();
  });

  it('düz anahtarı korur', () => {
    expect(toObjectKey('products/x.webp')).toBe('products/x.webp');
  });

  it('harici/data değerler null', () => {
    expect(toObjectKey('http://random.example/x')).toBeNull();
    expect(toObjectKey('data:image/png;base64,AAA')).toBeNull();
  });
});

describe('isOwnStorageUrl', () => {
  it('yapılandırma yokken harici URL reddedilir', () => {
    expect(isOwnStorageUrl('http://localhost:8333/x')).toBe(false);
    expect(isOwnStorageUrl('http://example.com/x')).toBe(false);
  });

  it('geçersiz girdi reddedilir', () => {
    expect(isOwnStorageUrl('not-a-url')).toBe(false);
    expect(isOwnStorageUrl('data:image/png;base64,AAA')).toBe(false);
  });
});

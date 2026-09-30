import { describe, it, expect } from 'vitest';
import { sniffKind, isAllowedAttachment } from '@/lib/file-signature';

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

describe('file-signature', () => {
  it('PDF imzası', () => {
    expect(sniffKind(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe('pdf');
  });
  it('JPG imzası', () => {
    expect(sniffKind(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg');
  });
  it('PNG imzası', () => {
    expect(sniffKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe('png');
  });
  it('WebP imzası', () => {
    const head = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
    expect(sniffKind(head)).toBe('webp');
  });
  it('DWG imzası', () => {
    expect(sniffKind(bytes(0x41, 0x43, 0x31, 0x30, 0x31, 0x35))).toBe('dwg');
  });
  it('bilinmeyen tür', () => {
    expect(sniffKind(bytes(0x00, 0x01, 0x02, 0x03))).toBe('unknown');
  });
  it('boş/kısa girdi güvenli', () => {
    expect(sniffKind(bytes())).toBe('unknown');
    expect(isAllowedAttachment(bytes(0x25))).toBe(false);
  });
  it('izinli/izinli değil', () => {
    expect(isAllowedAttachment(bytes(0x25, 0x50, 0x44, 0x46))).toBe(true);
    expect(isAllowedAttachment(bytes(0x4d, 0x5a))).toBe(false); // exe
  });
});

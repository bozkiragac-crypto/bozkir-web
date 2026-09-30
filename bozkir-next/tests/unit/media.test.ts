import { describe, it, expect } from 'vitest';
import { parseImageField, serializeImageField, validateUpload, MAX_UPLOAD_MB } from '@/lib/media';
import { parseCsv, csvCell } from '@/lib/csv';
import { slugify } from '@/lib/slug';

describe('media', () => {
  it('parseImageField çok biçimli girdiyi diziye çevirir', () => {
    expect(parseImageField('["a","b"]')).toEqual(['a', 'b']);
    expect(parseImageField('a,b')).toEqual(['a', 'b']);
    expect(parseImageField('solo')).toEqual(['solo']);
    expect(parseImageField('')).toEqual([]);
    expect(parseImageField(null)).toEqual([]);
  });

  it('serializeImageField tek değeri düz metin tutar', () => {
    expect(serializeImageField(['a'])).toBe('a');
    expect(serializeImageField(['a', 'b'])).toBe('["a","b"]');
    expect(serializeImageField([])).toBeNull();
  });

  it('validateUpload boyut ve tür kontrolü', () => {
    expect(validateUpload({ size: 1000, type: 'image/png' })).toBeNull();
    expect(validateUpload({ size: (MAX_UPLOAD_MB + 1) * 1024 * 1024, type: 'image/png' })).toMatch(/MB/);
    expect(validateUpload({ size: 1000, type: 'text/plain' })).toMatch(/JPG|PNG|WebP|AVIF/);
  });
});

describe('csv', () => {
  it('tırnaklı ve virgüllü alanları ayrıştırır', () => {
    const rows = parseCsv('a,b,c\n1,"x,y",3');
    expect(rows).toEqual([['a', 'b', 'c'], ['1', 'x,y', '3']]);
  });

  it('çift tırnağı kaçış olarak çözer', () => {
    expect(parseCsv('a\n"he said ""hi"""')).toEqual([['a'], ['he said "hi"']]);
  });

  it('CRLF destekler ve boş satırları atar', () => {
    expect(parseCsv('a,b\r\n1,2\r\n\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('csvCell gerekli alanları tırnaklar', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('q"uote')).toBe('"q""uote"');
    expect(csvCell(null)).toBe('');
  });
});

describe('slugify', () => {
  it('Türkçe karakterleri dönüştürür', () => {
    expect(slugify('Yıldız Entegre Çağ Şölen Öü')).toBe('yildiz-entegre-cag-solen-ou');
  });
  it('noktalama/boşlukları tire yapar', () => {
    expect(slugify('MDF Lam 2026 / Katalog')).toBe('mdf-lam-2026-katalog');
  });
  it('baştaki/sondaki tireleri temizler', () => {
    expect(slugify('  --Merhaba--  ')).toBe('merhaba');
  });
});

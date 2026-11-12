import { describe, it, expect } from 'vitest';
import {
  categoryDisplayName,
  extractThickness,
  isMeaningfulCode,
  isMeaningfulSurface,
  mergeThicknesses,
  normalizeThickness,
} from '@/lib/product-display';

describe('isMeaningfulSurface', () => {
  it('gerçek yüzey adlarını kabul eder', () => {
    expect(isMeaningfulSurface('Mat')).toBe(true);
    expect(isMeaningfulSurface('Parlak')).toBe(true);
    expect(isMeaningfulSurface('Mat 3D')).toBe(true);
  });

  it('boş ve sayısal değerleri gizler', () => {
    expect(isMeaningfulSurface('')).toBe(false);
    expect(isMeaningfulSurface('   ')).toBe(false);
    expect(isMeaningfulSurface(null)).toBe(false);
    expect(isMeaningfulSurface('1')).toBe(false);
    expect(isMeaningfulSurface('2')).toBe(false);
    expect(isMeaningfulSurface('3 - İZMİT')).toBe(false);
  });
});

describe('isMeaningfulCode', () => {
  it('rakam içeren gerçek kodları kabul eder', () => {
    expect(isMeaningfulCode('YT-40C', 'MDF LAM', 'Hezaren')).toBe(true);
    expect(isMeaningfulCode('VT-025', 'MDF LAM', 'Mavi')).toBe(true);
    expect(isMeaningfulCode('SGL-51A', 'LAK PANEL', 'Royal Mermer')).toBe(true);
  });

  it('kategori adı veya metin olan kodları gizler', () => {
    expect(isMeaningfulCode('PVC', 'PVC KENAR', 'Zenith')).toBe(false);
    expect(isMeaningfulCode('MDF', 'MDF', '18mm Ham')).toBe(false);
    expect(isMeaningfulCode('Duvar Profili', 'DUVAR PROFİLİ', 'Ankara')).toBe(false);
    expect(isMeaningfulCode('(L)', 'PERVAZ', 'Pervaz')).toBe(false);
    expect(isMeaningfulCode('', 'MDF LAM', 'Hezaren')).toBe(false);
  });

  it('ürün adıyla aynı olan kodu gizler', () => {
    expect(isMeaningfulCode('Kapı 18', 'KAPI PANEL', 'Kapı 18')).toBe(false);
  });
});

describe('normalizeThickness', () => {
  it('sayıyı mm biçimine getirir', () => {
    expect(normalizeThickness('18')).toBe('18 mm');
    expect(normalizeThickness('18mm')).toBe('18 mm');
    expect(normalizeThickness(' 18 mm ')).toBe('18 mm');
    expect(normalizeThickness('18,0')).toBe('18 mm');
    expect(normalizeThickness('2,7')).toBe('2.7 mm');
  });

  it('tanınmayan değerleri olduğu gibi bırakır', () => {
    expect(normalizeThickness('Standart')).toBe('Standart');
    expect(normalizeThickness('')).toBe('');
  });
});

describe('extractThickness', () => {
  it('addaki mm değerini kalınlığa çevirir', () => {
    expect(extractThickness('18mm Ham')).toEqual(['18 mm']);
    expect(extractThickness('2,7mm Ham')).toEqual(['2.7 mm']);
    expect(extractThickness('15 mm Osb')).toEqual(['15 mm']);
  });

  it('kalınlık içermeyen adlarda boş döner', () => {
    expect(extractThickness('Hezaren')).toEqual([]);
    expect(extractThickness('')).toEqual([]);
    expect(extractThickness(null)).toEqual([]);
  });

  it('tekrarlanan değeri tekilleştirir', () => {
    expect(extractThickness('18mm 18 mm')).toEqual(['18 mm']);
  });
});

describe('mergeThicknesses', () => {
  it('kayıtlı ve isimden türetilen değerleri birleştirir', () => {
    expect(mergeThicknesses([], '18mm Ham')).toEqual(['18 mm']);
    expect(mergeThicknesses(['18'], 'Hezaren')).toEqual(['18 mm']);
    expect(mergeThicknesses(['18 mm'], '18mm Ham')).toEqual(['18 mm']);
  });

  it('sayısal olmayan değerleri korur', () => {
    expect(mergeThicknesses(['Standart'], 'Levha')).toEqual(['Standart']);
  });
});

describe('categoryDisplayName', () => {
  it('kanonik slug üzerinden tek yazım döndürür', () => {
    expect(categoryDisplayName('mdflam', 'MDFLAM')).toBe('MDF Lam');
    expect(categoryDisplayName('lak-panel', 'LAKPANEL')).toBe('Lak Panel');
    expect(categoryDisplayName('suntalam', 'SUNTA LAM')).toBe('Suntalam');
  });

  it('dile göre çevrilmiş ad döndürür', () => {
    expect(categoryDisplayName('mdflam', 'MDFLAM', 'en')).toBe('MDF Lam');
    expect(categoryDisplayName('lak-panel', 'LAKPANEL', 'en')).toBe('Lacquer Panel');
    expect(categoryDisplayName('sunta', 'SUNTA LAM', 'en')).toBe('Chipboard');
  });

  it('sözlükte olmayan kategoride DB metnini kullanır', () => {
    expect(categoryDisplayName('ozel-kategori', 'Özel Ürün', 'en', 'Custom Product')).toBe(
      'Custom Product',
    );
    expect(categoryDisplayName('ozel-kategori', 'Özel Ürün', 'en')).toBe('Özel Ürün');
  });
});

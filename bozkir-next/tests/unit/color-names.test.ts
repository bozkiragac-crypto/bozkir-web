import { describe, it, expect } from 'vitest';
import {
  decorKey,
  deriveColors,
  isDecorName,
  localizeColor,
  translateDecorName,
} from '@/data/color-names';

describe('decorKey', () => {
  it('büyük/küçük harf, parantez, tire ve boşlukları normalize eder', () => {
    expect(decorKey('Mavi')).toBe('mavi');
    expect(decorKey('Ayna (Krom)')).toBe('ayna krom');
    expect(decorKey('Sedef Krem - Ay Taşı')).toBe('sedef krem ay taşı');
    expect(decorKey('  Kum   Beji  ')).toBe('kum beji');
  });
});

describe('isDecorName', () => {
  it('renk ve ahşap adlarını tanır', () => {
    expect(isDecorName('Mavi')).toBe(true);
    expect(isDecorName('Kayın')).toBe(true);
    expect(isDecorName('Ceviz')).toBe(true);
    expect(isDecorName('Antrasit Meşe')).toBe(true);
    expect(isDecorName('Safir Meşe')).toBe(true);
    expect(isDecorName('Sedef Krem - Ay Taşı')).toBe(true);
    expect(isDecorName('Ayna (Krom)')).toBe(true);
    expect(isDecorName('Akça Ağaç')).toBe(true);
    expect(isDecorName('Akçağaç')).toBe(true);
  });

  it('marka/seri adlarını ve teknik adları renk saymaz', () => {
    expect(isDecorName('Hezaren')).toBe(false);
    expect(isDecorName('Zenith')).toBe(false);
    expect(isDecorName('Royal Mermer')).toBe(false);
    expect(isDecorName('Marmo')).toBe(false);
    expect(isDecorName('Kaman Ceviz')).toBe(false);
    expect(isDecorName('Ankara')).toBe(false);
    expect(isDecorName('18mm Ham')).toBe(false);
    expect(isDecorName('')).toBe(false);
    expect(isDecorName(null)).toBe(false);
  });
});

describe('translateDecorName', () => {
  it('tüm kelimeler eşleşiyorsa çevirir', () => {
    expect(translateDecorName('Mavi', 'en')).toBe('Blue');
    expect(translateDecorName('Kayın', 'en')).toBe('Beech');
    expect(translateDecorName('Ceviz', 'ar')).toBe('جوز');
    expect(translateDecorName('Antrasit Meşe', 'en')).toBe('Anthracite Oak');
    expect(translateDecorName('Safir Meşe', 'en')).toBe('Sapphire Oak');
    expect(translateDecorName('Kum Beji', 'en')).toBe('Sand Beige');
    expect(translateDecorName('Ay Taşı', 'en')).toBe('Moonstone');
    expect(translateDecorName('Sedef Krem - Ay Taşı', 'en')).toBe('Pearl Cream · Moonstone');
    expect(translateDecorName('Ayna (Krom)', 'en')).toBe('Mirror (Chrome)');
  });

  it('marka/seri adlarını olduğu gibi bırakır', () => {
    expect(translateDecorName('Hezaren', 'en')).toBe('Hezaren');
    expect(translateDecorName('Zenith', 'ar')).toBe('Zenith');
    expect(translateDecorName('Royal Mermer', 'en')).toBe('Royal Mermer');
    expect(translateDecorName('Kaman Ceviz', 'en')).toBe('Kaman Ceviz');
  });

  it('Türkçe ve tanımsız dilde metni değiştirmez', () => {
    expect(translateDecorName('Mavi', 'tr')).toBe('Mavi');
    expect(translateDecorName('Mavi')).toBe('Mavi');
  });
});

describe('localizeColor', () => {
  it('filtre etiketi için çevirir, eşleşmeyeni korur', () => {
    expect(localizeColor('Sis Gri', 'en')).toBe('Fog Grey');
    expect(localizeColor('Koton Bej', 'en')).toBe('Cotton Beige');
    expect(localizeColor('Bilinmeyen Dekor', 'en')).toBe('Bilinmeyen Dekor');
  });
});

describe('deriveColors', () => {
  it('admin renkleri varsa onları korur', () => {
    expect(deriveColors(['Meşe', 'Ceviz'], 'Hezaren')).toEqual(['Meşe', 'Ceviz']);
    expect(deriveColors(['  Bej  '], 'Mavi')).toEqual(['Bej']);
  });

  it('renkler boşsa ve ad renk/ahşap adıysa adı kullanır', () => {
    expect(deriveColors([], 'Mavi')).toEqual(['Mavi']);
    expect(deriveColors([], 'Kayın')).toEqual(['Kayın']);
    expect(deriveColors([], 'Safir Meşe')).toEqual(['Safir Meşe']);
  });

  it('ad renk değilse boş döner', () => {
    expect(deriveColors([], 'Hezaren')).toEqual([]);
    expect(deriveColors([], 'Royal Mermer')).toEqual([]);
    expect(deriveColors([], '18mm Ham')).toEqual([]);
    expect(deriveColors([], undefined)).toEqual([]);
  });
});

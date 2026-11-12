import { describe, it, expect } from 'vitest';
import {
  collectFacetValues,
  facetMatches,
  localizedCategoryName,
  parseImageList,
  pickLocaleText,
  sortFacetValues,
} from '@/lib/data/catalog';
import type { Category } from '@/types/category';

describe('pickLocaleText', () => {
  it('locale için çeviri varsa onu döndürür', () => {
    expect(pickLocaleText('Türkçe', 'en', 'English', 'عربي')).toBe('English');
    expect(pickLocaleText('Türkçe', 'ar', 'English', 'عربي')).toBe('عربي');
    expect(pickLocaleText('Türkçe', 'tr', 'English', 'عربي')).toBe('Türkçe');
  });

  it('çeviri boşsa Türkçeye düşer', () => {
    expect(pickLocaleText('Türkçe', 'en', '', null)).toBe('Türkçe');
    expect(pickLocaleText('Türkçe', 'ar', undefined, undefined)).toBe('Türkçe');
  });

  it('locale tanımsızsa Türkçe döner', () => {
    expect(pickLocaleText('Türkçe', undefined, 'English', 'عربي')).toBe('Türkçe');
  });

  it('boşluklu çeviriyi yok sayar', () => {
    expect(pickLocaleText('Türkçe', 'en', '   ', '')).toBe('Türkçe');
  });
});

describe('localizedCategoryName', () => {
  const cat: Category = {
    id: 'mdflam',
    slug: 'mdflam',
    name: 'MDF Lam',
    nameEn: 'MDF Lam EN',
    nameAr: 'عربي',
    description: '',
  };
  it('dile göre kategori adı seçer', () => {
    expect(localizedCategoryName(cat, 'en')).toBe('MDF Lam EN');
    expect(localizedCategoryName(cat, 'ar')).toBe('عربي');
    expect(localizedCategoryName(cat, 'tr')).toBe('MDF Lam');
  });
  it('çeviri yoksa TR adına düşer', () => {
    expect(localizedCategoryName({ ...cat, nameEn: '', nameAr: '' }, 'en')).toBe('MDF Lam');
  });
});

describe('parseImageList', () => {
  it('JSON diziyi ayrıştırır', () => {
    expect(parseImageList('["a.webp","b.webp"]')).toEqual(['a.webp', 'b.webp']);
  });
  it('virgüllü listeyi ayrıştırır', () => {
    expect(parseImageList('a.webp, b.webp ,c.webp')).toEqual(['a.webp', 'b.webp', 'c.webp']);
  });
  it('tek değeri döndürür', () => {
    expect(parseImageList('only.webp')).toEqual(['only.webp']);
  });
  it('data URI korunur', () => {
    expect(parseImageList('data:image/png;base64,AAAA')).toEqual(['data:image/png;base64,AAAA']);
  });
  it('boş/null güvenli', () => {
    expect(parseImageList('')).toEqual([]);
    expect(parseImageList(null)).toEqual([]);
    expect(parseImageList(undefined)).toEqual([]);
  });
  it('bozuk JSON güvenli', () => {
    expect(parseImageList('[bozuk')).toEqual([]);
  });
});

describe('collectFacetValues', () => {
  it('normalize ederek tekilleştirir (ilk yazım korunur)', () => {
    expect(collectFacetValues(['Bej', 'BEJ', ' bej '])).toEqual(['Bej']);
  });
  it('boş değerleri atar', () => {
    expect(collectFacetValues(['', '  ', '18 mm'])).toEqual(['18 mm']);
  });
  it('kalınlıkları sayısal sıralar', () => {
    expect(collectFacetValues(['18 mm', '8 mm', '10 mm'])).toEqual(['8 mm', '10 mm', '18 mm']);
  });
});

describe('sortFacetValues', () => {
  it('sayısal önek yoksa alfabetik sıralar', () => {
    expect(sortFacetValues(['Ceviz', 'Bej', 'Antik'])).toEqual(['Antik', 'Bej', 'Ceviz']);
  });
  it('girdiyi değiştirmez', () => {
    const input = ['18 mm', '8 mm'];
    sortFacetValues(input);
    expect(input).toEqual(['18 mm', '8 mm']);
  });
});

describe('facetMatches', () => {
  it('boşluk/noktalama duyarsız eşleşir', () => {
    expect(facetMatches(['18 mm'], '18MM')).toBe(true);
    expect(facetMatches(['18 mm'], '8 mm')).toBe(false);
  });
  it('değer yoksa veya filtre boşsa eşleşir', () => {
    expect(facetMatches(undefined, '')).toBe(true);
    expect(facetMatches([], 'bej')).toBe(false);
  });
});

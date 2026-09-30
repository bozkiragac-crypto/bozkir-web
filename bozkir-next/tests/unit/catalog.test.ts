import { describe, it, expect } from 'vitest';
import { pickLocaleText, localizedCategoryName, parseImageList } from '@/lib/data/catalog';
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

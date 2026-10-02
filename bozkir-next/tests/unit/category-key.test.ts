import { describe, it, expect } from 'vitest';
import { categoryKeyOf, categorySlugOf, toAscii } from '@/lib/data/category-key';

/**
 * `products.cat` aynı kategoriyi farklı yazımlarla tutuyor. Kategori silme
 * işlemi ile vitrin kategori listesi aynı slug'ı türetmezse kategori "silinince"
 * geri doyar.
 */
describe('categoryKeyOf', () => {
  it('Türkçe harfleri ASCII karşılığına indirger', () => {
    expect(toAscii('DUVAR PROFİLİ')).toBe('DUVAR PROFILI');
    expect(toAscii('MASİF PANEL')).toBe('MASIF PANEL');
    expect(toAscii('ÇÖĞÜŞİİ')).toBe('COGUSII');
  });

  it('büyük/küçük harf, boşluk ve ayraç farklarını siler', () => {
    expect(categoryKeyOf('PVC Kenar')).toBe('PVCKENAR');
    expect(categoryKeyOf('PVC KENAR')).toBe('PVCKENAR');
    expect(categoryKeyOf('pvc  kenar')).toBe('PVCKENAR');
    expect(categoryKeyOf('Pvc-Kenar')).toBe('PVCKENAR');
  });
});

describe('categorySlugOf', () => {
  it('yazım farklılıklarını aynı kanonik slug a indirger', () => {
    // Bu değerler gerçek DB'de aynı kategoride duruyor.
    const pvc = ['PVC KENAR', 'PVC Kenar', 'pvc kenar'];
    expect(new Set(pvc.map(categorySlugOf))).toEqual(new Set(['pvc-kenar-bant']));

    const mdflam = ['MDF LAM', 'MDFLAM', 'Mdf Lam', 'mdflam'];
    expect(new Set(mdflam.map(categorySlugOf))).toEqual(new Set(['mdflam']));

    const lak = ['LAK PANEL', 'LAKPANEL', 'Lak Panel'];
    expect(new Set(lak.map(categorySlugOf))).toEqual(new Set(['lak-panel']));
  });

  it('her gerçek ürün cat değerini bilinen bir kategoriye bağlar', () => {
    // SELECT DISTINCT cat FROM products WHERE is_active (2026-10-02)
    const realValues = [
      'PVC KENAR',
      'MDF LAM',
      'LAK PANEL',
      'MDFLAM',
      'MDF',
      'DUVAR PROFİLİ',
      'SUNTALAM',
      'KAPI PANEL',
      'LAKPANEL',
      'KAPLAMALI MDF',
      'OSB',
      'TUTKAL',
      'PERVAZ',
      'SUNTA',
      'MASİF PANEL',
      'Tutkal',
      'SUNTA LAM',
    ];

    const slugs = new Set(realValues.map(categorySlugOf));
    expect(slugs).toEqual(
      new Set([
        'pvc-kenar-bant',
        'mdflam',
        'lak-panel',
        'mdf',
        'duvar-profili',
        'suntalam',
        'kapi-panel',
        'kaplamali-mdf',
        'osb',
        'tutkal',
        'pervaz',
        'sunta',
        'masif-panel',
      ]),
    );
  });

  it('boş metin boş slug verir', () => {
    expect(categorySlugOf('')).toBe('');
    expect(categorySlugOf('   ')).toBe('');
  });

  it('bilinmeyen metni slugify eder', () => {
    expect(categorySlugOf('Cam Profil')).toBe('cam-profil');
    expect(categorySlugOf('Yeni Ürün Grubu')).toBe('yeni-urun-grubu');
  });
});
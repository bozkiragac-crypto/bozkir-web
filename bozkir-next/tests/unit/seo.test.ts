import { describe, it, expect } from 'vitest';
import {
  buildMetadata,
  breadcrumbJsonLd,
  itemListJsonLd,
  localeUrl,
  absoluteUrl,
  organizationJsonLd,
  paginatedPath,
  productJsonLd,
  websiteJsonLd,
} from '@/lib/seo';

describe('seo', () => {
  it('absoluteUrl site köküne göre üretir', () => {
    expect(absoluteUrl('/urunler')).toMatch(/\/urunler$/);
  });

  it('localeUrl dil öneği ekler', () => {
    expect(localeUrl('en', '/urunler/mdflam')).toMatch(/\/en\/urunler\/mdflam$/);
    expect(localeUrl('tr', '/')).toMatch(/\/tr$/);
    expect(localeUrl(undefined, '/urunler')).toMatch(/\/urunler$/);
  });

  it('buildMetadata canonical + hreflang üretir', () => {
    const m = buildMetadata({
      title: 'Ürünler',
      description: 'desc',
      path: '/urunler',
      locale: 'en',
    });
    expect(m.alternates?.canonical).toMatch(/\/en\/urunler$/);
    const langs = m.alternates?.languages as Record<string, string>;
    expect(langs.tr).toMatch(/\/tr\/urunler$/);
    expect(langs.en).toMatch(/\/en\/urunler$/);
    expect(langs.ar).toMatch(/\/ar\/urunler$/);
    expect(langs['x-default']).toMatch(/\/tr\/urunler$/);
  });

  it('noIndex robots ayarı', () => {
    const m = buildMetadata({ title: 'x', path: '/favoriler', noIndex: true });
    expect((m.robots as { index: boolean }).index).toBe(false);
  });

  it('organizationJsonLd admin iletişim bilgilerini kullanır', () => {
    const json = organizationJsonLd([], 'Bozkır', '/logo.png', {
      phone: '+90 555 000 00 00',
      email: 'test@example.com',
      address: {
        street: 'Test Sokak 1',
        locality: 'Antakya',
        region: 'Hatay',
        postalCode: '31000',
        country: 'TR',
      },
      warehouse: { coords: '36.2,36.1' },
    });
    expect(json.telephone).toBe('+90 555 000 00 00');
    expect(json.email).toBe('test@example.com');
    expect(json.address.streetAddress).toBe('Test Sokak 1');
  });

  it('breadcrumbJsonLd dile göre anahtarları kurar', () => {
    const json = breadcrumbJsonLd(
      [
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Ürünler', path: '/urunler' },
      ],
      'ar',
    );
    expect(json['@type']).toBe('BreadcrumbList');
    expect(json.itemListElement).toHaveLength(2);
    expect(json.itemListElement[0]!.item).toMatch(/\/ar$/);
    expect(json.itemListElement[1]!.item).toMatch(/\/ar\/urunler$/);
  });

  it('paginatedPath ilk sayfada temiz yolu korur', () => {
    expect(paginatedPath('/urunler', 1)).toBe('/urunler');
    expect(paginatedPath('/urunler', 0)).toBe('/urunler');
    expect(paginatedPath('/urunler', Number.NaN)).toBe('/urunler');
    expect(paginatedPath('/urunler', 3)).toBe('/urunler?sayfa=3');
    expect(paginatedPath('/kategoriler/ahsap', 2.9)).toBe('/kategoriler/ahsap?sayfa=2');
  });

  it('paginatedPath mevcut sorguya & ile ekler', () => {
    expect(paginatedPath('/urunler?q=mdflam', 2, 'sayfa')).toBe('/urunler?q=mdflam&sayfa=2');
    expect(paginatedPath('/urunler', 2, 'page')).toBe('/urunler?page=2');
  });

  it('itemListJsonLd mutlak URL ve adet üretir', () => {
    const json = itemListJsonLd(
      [
        { name: 'MDF Lam', path: '/urunler/mdflam' },
        { name: 'Suntalam', path: '/urunler/suntalam' },
      ],
      'en',
      'Ürünler',
    );
    expect(json['@type']).toBe('ItemList');
    expect(json.name).toBe('Ürünler');
    expect(json.numberOfItems).toBe(2);
    expect(json.itemListElement[0]!.position).toBe(1);
    expect(json.itemListElement[1]!.url).toMatch(/\/en\/urunler\/suntalam$/);
  });

  it('productJsonLd gerçek özellikleri additionalProperty ile verir, offers eklemez', () => {
    const url = absoluteUrl('/tr/urunler/mdflam');
    const json = productJsonLd({
      name: 'MDF Lam',
      description: 'Açıklama',
      url,
      category: 'MDF',
      brandName: 'Bozkır',
      code: 'MDF-18',
      images: ['/images/a.jpg', ''],
      properties: [
        { name: 'Kalınlık', value: '18 mm' },
        { name: '', value: 'yok sayılır' },
      ],
    });
    expect(json['@type']).toBe('Product');
    expect(json['@id']).toBe(url);
    expect(json.url).toBe(url);
    expect(json.sku).toBe('MDF-18');
    expect(json.image).toHaveLength(1);
    expect(json.image![0]).toMatch(/\/images\/a\.jpg$/);
    expect(json.additionalProperty).toHaveLength(1);
    expect(json.additionalProperty![0]!.value).toBe('18 mm');
    expect('offers' in json).toBe(false);
  });

  it('productJsonLd kod yoksa sku/mpn basmaz', () => {
    const json = productJsonLd({
      name: 'Ürün',
      description: 'Açıklama',
      url: absoluteUrl('/tr/urunler/x'),
      category: 'Kategori',
      brandName: 'Bozkır',
    });
    expect('sku' in json).toBe(false);
    expect('image' in json).toBe(false);
    expect('additionalProperty' in json).toBe(false);
  });

  it('websiteJsonLd publisher ve opsiyonel açıklama içerir', () => {
    const json = websiteJsonLd('ar', 'Bozkır', 'Açıklama');
    expect(json['@type']).toBe('WebSite');
    expect(json.inLanguage).toBe('ar');
    expect(json.description).toBe('Açıklama');
    expect(json.publisher['@id']).toMatch(/#store$/);
    expect((json.potentialAction.target as { urlTemplate: string }).urlTemplate).toMatch(
      /\/ar\/urunler\?q=\{search_term_string\}$/,
    );
    expect('description' in websiteJsonLd('tr', 'Bozkır')).toBe(false);
  });
});

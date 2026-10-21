import { describe, it, expect } from 'vitest';
import {
  buildMetadata,
  breadcrumbJsonLd,
  localeUrl,
  absoluteUrl,
  organizationJsonLd,
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
});

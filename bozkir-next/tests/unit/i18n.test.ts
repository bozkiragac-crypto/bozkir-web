import { describe, it, expect } from 'vitest';
import { isLocale, localizePath, switchLocaleInPath, localeDir, defaultLocale } from '@/i18n/config';

describe('i18n config', () => {
  it('isLocale geçerli/geçersiz değerleri ayırır', () => {
    expect(isLocale('tr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('varsayılan dil TR', () => {
    expect(defaultLocale).toBe('tr');
  });

  it('Arapça RTL', () => {
    expect(localeDir.ar).toBe('rtl');
    expect(localeDir.tr).toBe('ltr');
  });

  it('localizePath dil öneği ekler', () => {
    expect(localizePath('tr', '/urunler')).toBe('/tr/urunler');
    expect(localizePath('en', '/')).toBe('/en');
    expect(localizePath('ar', 'urunler')).toBe('/ar/urunler');
  });

  it('switchLocaleInPath dili değiştirir', () => {
    expect(switchLocaleInPath('/tr/urunler', 'en')).toBe('/en/urunler');
    expect(switchLocaleInPath('/urunler', 'ar')).toBe('/ar/urunler');
    expect(switchLocaleInPath('/tr', 'en')).toBe('/en');
    expect(switchLocaleInPath('/', 'en')).toBe('/en');
  });
});

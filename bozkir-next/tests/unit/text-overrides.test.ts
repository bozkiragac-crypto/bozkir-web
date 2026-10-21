import { describe, it, expect } from 'vitest';
import { getDictionary } from '@/i18n/dictionaries';
import { applyTextOverrides, getTextByPath, TEXT_PATHS } from '@/i18n/overrides';

describe('site metin override', () => {
  it('bilinen yolu değiştirir, orijinal sözlüğü bozmaz', () => {
    const dict = getDictionary('tr');
    const original = dict.home.hero.titleLead;
    const next = applyTextOverrides(dict, 'tr', {
      tr: { 'home.hero.titleLead': 'Yeni başlık' },
    });
    expect(next.home.hero.titleLead).toBe('Yeni başlık');
    expect(dict.home.hero.titleLead).toBe(original);
  });

  it('bilinmeyen anahtarı ve boş değeri yok sayar', () => {
    const dict = getDictionary('tr');
    const next = applyTextOverrides(dict, 'tr', {
      tr: { 'home.hero.titleLead': '   ', 'bilinmeyen.yol': 'x' },
    });
    expect(next.home.hero.titleLead).toBe(dict.home.hero.titleLead);
    expect(getTextByPath(next, 'bilinmeyen.yol')).toBe('');
  });

  it('dil bazlı override uygular', () => {
    const next = applyTextOverrides(getDictionary('en'), 'en', {
      en: { 'nav.products': 'Items' },
    });
    expect(next.nav.products).toBe('Items');
  });

  it('okuma anında HTML/control karakterlerini ve fazla uzunluğu temizler', () => {
    const next = applyTextOverrides(getDictionary('tr'), 'tr', {
      tr: {
        'nav.products': '<script>alert(1)</script>Ürünler',
        'home.hero.titleLead': 'x'.repeat(500),
      },
    });
    expect(next.nav.products).not.toContain('<');
    expect(next.nav.products).not.toContain('>');
    expect(next.home.hero.titleLead.length).toBeLessThanOrEqual(120);
  });

  it('registry yolları sözlükte mevcut', () => {
    const dict = getDictionary('tr');
    for (const path of TEXT_PATHS) {
      expect(getTextByPath(dict, path), path).not.toBe('');
    }
  });
});

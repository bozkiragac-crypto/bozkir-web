import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WHATSAPP_MESSAGES,
  buildProductWhatsAppMessage,
  fillTemplate,
  normalizeWhatsAppBase,
  resolveWhatsAppTemplate,
  whatsappHref,
} from '@/lib/whatsapp';

describe('whatsapp', () => {
  it('yer tutucuları doldurur ve boş parantezleri temizler', () => {
    const text = fillTemplate('Merhaba {product} ({code}). {url}', {
      product: 'MDF Lam',
      code: '',
      url: 'https://example.com/urun',
    });
    expect(text).toBe('Merhaba MDF Lam. https://example.com/urun');
  });

  it('boşluk ve noktalama fazlalığını temizler', () => {
    expect(fillTemplate('  A   B  ,  C .  ', {})).toBe('A B, C.');
  });

  it('telefon ve wa.me değerlerini normalize eder', () => {
    expect(normalizeWhatsAppBase('+90 535 527 16 12')).toBe('https://wa.me/905355271612');
    expect(normalizeWhatsAppBase('wa.me/905355271612')).toBe('https://wa.me/905355271612');
    expect(normalizeWhatsAppBase('', '+90 535 527 16 12')).toBe('https://wa.me/905355271612');
    expect(normalizeWhatsAppBase('')).toBe('');
  });

  it('metni encode edip mevcut text parametresini ezer', () => {
    const href = whatsappHref('https://wa.me/905355271612?text=eski', 'Merhaba Dünya');
    const url = new URL(href);
    expect(url.searchParams.get('text')).toBe('Merhaba Dünya');
  });

  it('dil şablonunu, yoksa TR fallbackini kullanır', () => {
    expect(resolveWhatsAppTemplate(undefined, 'en', 'general')).toBe(
      DEFAULT_WHATSAPP_MESSAGES.general.en,
    );
    const partial = {
      general: { tr: 'TR', en: '', ar: 'AR' },
      product: { tr: 'PTR', en: 'PEN', ar: 'PAR' },
    };
    expect(resolveWhatsAppTemplate(partial, 'en', 'general')).toBe('TR');
  });

  it('ürün mesajında ürün bazlı metni önceliklendirir', () => {
    const product = {
      name: 'MDF Lam',
      code: 'MDF',
      category: 'MDF LAM',
      slug: 'mdf-lam-mdf',
      whatsappMessage: 'Özel: {product} / {code} / {category} / {url}',
    };
    const text = buildProductWhatsAppMessage(
      product,
      DEFAULT_WHATSAPP_MESSAGES,
      'tr',
      'https://example.com/p',
    );
    expect(text).toBe('Özel: MDF Lam / MDF / MDF LAM / https://example.com/p');
  });
});

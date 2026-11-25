import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WHATSAPP_MESSAGES,
  buildProductWhatsAppMessage,
  buildQuoteWhatsAppMessage,
  fillTemplate,
  isLegacyWhatsAppTemplate,
  normalizeWhatsAppBase,
  normalizeWhatsAppMessages,
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
      sample: { tr: 'STR', en: 'SEN', ar: 'SAR' },
      quote: { tr: 'QTR', en: 'QEN', ar: 'QAR' },
      share: { tr: 'HTR', en: 'HEN', ar: 'HAR' },
    };
    expect(resolveWhatsAppTemplate(partial, 'en', 'general')).toBe('TR');
  });

  it('yeni intent şablonlarını çözer ve eksik intentleri genel şablona düşürür', () => {
    expect(resolveWhatsAppTemplate(undefined, 'tr', 'sample')).toBe(
      DEFAULT_WHATSAPP_MESSAGES.sample.tr,
    );
    const partial = {
      general: { tr: 'GENEL', en: '', ar: '' },
      product: { tr: 'URUN', en: '', ar: '' },
      sample: { tr: 'NUMUNE {product}', en: '', ar: '' },
      quote: { tr: 'TEKLIF', en: '', ar: '' },
      share: { tr: 'PAYLAS', en: '', ar: '' },
    };
    expect(resolveWhatsAppTemplate(partial, 'en', 'sample')).toBe('NUMUNE {product}');
    const legacy = {
      general: { tr: 'GENEL', en: '', ar: '' },
      product: { tr: 'URUN', en: '', ar: '' },
    } as typeof DEFAULT_WHATSAPP_MESSAGES;
    expect(resolveWhatsAppTemplate(legacy, 'en', 'quote')).toBe('GENEL');
  });

  it('ürün mesajını yüzey/kalınlık/ölçü/stok bilgisiyle zenginleştirir', () => {
    const product = {
      name: 'MDF Lam',
      code: 'MDF-51192',
      category: 'MDF Lam',
      slug: 'mdf-lam-51192',
      face: 'Mat',
      thicknesses: ['18 mm'],
      dimensions: '2800 × 2100 mm',
      availabilityStatus: 'in_stock' as const,
    };
    const messages = {
      ...DEFAULT_WHATSAPP_MESSAGES,
      product: {
        ...DEFAULT_WHATSAPP_MESSAGES.product,
        tr: 'Merhaba, {product} ({code}) için fiyat alabilir miyim? {surface} / {thickness} / {dimensions} / {availability} / {url}',
      },
    };
    const text = buildProductWhatsAppMessage(
      product,
      messages,
      'tr',
      'https://example.com/p',
      { locale: 'tr', availabilityLabel: (key) => (key === 'in_stock' ? 'Stokta' : '') },
    );
    expect(text).toBe(
      'Merhaba, MDF Lam (MDF-51192) için fiyat alabilir miyim? Mat / 18 mm / 2800 × 2100 mm / Stokta / https://example.com/p',
    );
  });

  it('eski varsayılan ürün şablonunu yeni varsayılana düşürür', () => {
    expect(
      isLegacyWhatsAppTemplate(
        'product',
        'tr',
        'Merhaba, {product} ({code}) ürünü hakkında bilgi ve fiyat teklifi almak istiyorum. {url}',
      ),
    ).toBe(true);
    expect(
      isLegacyWhatsAppTemplate(
        'product',
        'tr',
        'Merhaba, {product} ({code}) ürünüz hakkında bilgi ve fiyat teklifi almak istiyorum. {url}',
      ),
    ).toBe(true);
    expect(isLegacyWhatsAppTemplate('product', 'tr', 'Özel: {product} / {url}')).toBe(false);
  });

  it('admin kaydında yeni intentler eksikse mevcut varsayılanı korur', () => {
    const normalized = normalizeWhatsAppMessages(
      {
        general: { tr: `  ${'Y'.repeat(1100)}  `, en: '', ar: '' },
        product: { tr: 'ÜRÜN', en: '', ar: '' },
      },
      DEFAULT_WHATSAPP_MESSAGES,
    );
    expect(normalized.general.tr).toBe('Y'.repeat(1000));
    expect(normalized.general.en).toBe(DEFAULT_WHATSAPP_MESSAGES.general.en);
    expect(normalized.sample.tr).toBe(DEFAULT_WHATSAPP_MESSAGES.sample.tr);
    expect(normalized.quote.tr).toBe(DEFAULT_WHATSAPP_MESSAGES.quote.tr);
    expect(normalized.share.tr).toBe(DEFAULT_WHATSAPP_MESSAGES.share.tr);
  });

  it('teklif mesajını seçili ürünler ve form özetiyle doldurur', () => {
    const text = buildQuoteWhatsAppMessage(undefined, 'tr', {
      products: ['MDF Lam (MDF-1)', 'Sunta (SNT-2)'],
      fullName: 'Ahmet Yılmaz',
      quantity: '100',
      page: '/teklif-al',
    });
    expect(text).toContain('MDF Lam (MDF-1), Sunta (SNT-2)');
    expect(text).toContain('Ad Soyad: Ahmet Yılmaz');
    expect(text).toContain('Adet: 100');
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

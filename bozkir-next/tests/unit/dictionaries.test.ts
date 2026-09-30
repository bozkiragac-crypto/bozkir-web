import { describe, it, expect } from 'vitest';
import { dictionaries, getDictionary, t } from '@/i18n/dictionaries';
import { locales } from '@/i18n/config';

/** Bir nesnenin tüm yaprak anahtarlarını "a.b.c" biçiminde toplar. */
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  if (Array.isArray(obj)) {
    // Diziler: her elemanın yolunu index ile topla (yapı paritesi için).
    return obj.flatMap((v, i) => keyPaths(v, `${prefix}[${i}]`));
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('dictionaries', () => {
  it('tüm diller tanımlı ve güvenli erişim', () => {
    for (const l of locales) {
      expect(dictionaries[l]).toBeTruthy();
      expect(Object.keys(dictionaries[l]).length).toBeGreaterThan(10);
    }
  });

  it('EN ve AR, TR ile aynı anahtar yapısına sahip (i18n regresyon koruması)', () => {
    const trKeys = keyPaths(dictionaries.tr).sort();
    for (const l of ['en', 'ar'] as const) {
      const keys = keyPaths(dictionaries[l]).sort();
      const missing = trKeys.filter((k) => !keys.includes(k));
      const extra = keys.filter((k) => !trKeys.includes(k));
      expect(missing, `${l} eksik anahtarlar: ${missing.join(', ')}`).toEqual([]);
      expect(extra, `${l} fazla anahtarlar: ${extra.join(', ')}`).toEqual([]);
    }
  });

  it('TR sözlüğünde hiçbir yaprak değer boş değil', () => {
    const walk = (obj: unknown, path: string): void => {
      if (typeof obj === 'string') {
        expect(obj.trim().length, `${path} boş`).toBeGreaterThan(0);
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach((v, i) => walk(v, `${path}[${i}]`));
        return;
      }
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) walk(v, `${path}.${k}`);
      }
    };
    walk(dictionaries.tr, 'tr');
  });

  it('getDictionary geçersiz dilde TR döner', () => {
    expect(getDictionary('de' as never)).toBe(dictionaries.tr);
  });

  it('t() nokta yoluyla okur, bilinmeyende yolu döndürür', () => {
    expect(t(dictionaries.tr, 'nav.products')).toBe(dictionaries.tr.nav.products);
    expect(t(dictionaries.tr, 'yok.boyle.birsey')).toBe('yok.boyle.birsey');
  });

  it('AR sözlüğü gerçekten Arapça harfler içerir (örneklem)', () => {
    const ar = dictionaries.ar;
    expect(ar.nav.products).toMatch(/[\u0600-\u06FF]/);
    expect(ar.common.home).toMatch(/[\u0600-\u06FF]/);
  });
});

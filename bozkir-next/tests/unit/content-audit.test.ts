import { describe, expect, it } from 'vitest';
import { summarizeContentAudit, type AuditProductRow } from '@/lib/admin/content-audit';

function row(partial: Partial<AuditProductRow> & { id: string }): AuditProductRow {
  return {
    name: 'Ürün',
    code: 'UR-1',
    img: '/media/products/x.webp',
    description: 'Açıklama',
    shortDescription: null,
    ...partial,
  };
}

describe('summarizeContentAudit', () => {
  it('görseiz ve açıklamasız ürünleri ayrı ayrı sayar', () => {
    const result = summarizeContentAudit([
      row({ id: '1', img: '' }),
      row({ id: '2', description: '' }),
      row({ id: '3', img: null, description: null }),
      row({ id: '4' }),
    ]);

    expect(result.total).toBe(4);
    expect(result.missingImageCount).toBe(2);
    expect(result.missingDescriptionCount).toBe(2);
    expect(result.affectedCount).toBe(3);
  });

  it('boşluklu alanları eksik sayar', () => {
    const result = summarizeContentAudit([
      row({ id: '1', img: '   ', description: '   ', shortDescription: '  ' }),
    ]);
    expect(result.missingImageCount).toBe(1);
    expect(result.missingDescriptionCount).toBe(1);
  });

  it('kısa açıklama varsa ürünü açıklamalı sayar', () => {
    const result = summarizeContentAudit([
      row({ id: '1', description: '', shortDescription: 'Kısa açıklama' }),
    ]);
    expect(result.missingDescriptionCount).toBe(0);
    expect(result.affectedCount).toBe(0);
  });

  it('örnekler yalnızca eksikli olan ürünlerden ve en fazla 5 tane', () => {
    const rows = Array.from({ length: 8 }, (_, i) => row({ id: String(i), img: '' }));
    rows.push(row({ id: 'ok' }));
    const result = summarizeContentAudit(rows);

    expect(result.samples).toHaveLength(5);
    expect(result.samples.every((s) => s.missingImage)).toBe(true);
    expect(result.samples.map((s) => s.id)).toEqual(['0', '1', '2', '3', '4']);
  });

  it('boş liste sıfırları döndürür', () => {
    expect(summarizeContentAudit([])).toEqual({
      total: 0,
      missingImageCount: 0,
      missingDescriptionCount: 0,
      affectedCount: 0,
      samples: [],
    });
  });
});

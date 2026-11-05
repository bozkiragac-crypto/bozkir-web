import { describe, expect, it } from 'vitest';
import { buildSpecRail } from '@/lib/product-specs';
import type { Product } from '@/types/product';

const labels = { surface: 'Yüzey', thickness: 'Kalınlık', color: 'Renkler', code: 'Kod' };
const base: Product = {
  id: '1',
  slug: 'a',
  name: 'A',
  category: 'Panel',
  categorySlug: 'panel',
  images: [],
};

describe('buildSpecRail', () => {
  it('boş alanları atlar', () => {
    expect(buildSpecRail({ ...base, face: 'Mat' }, labels)).toEqual([
      { key: 'surface', label: 'Yüzey', value: 'Mat' },
    ]);
  });

  it('kalınlıkları ilk 3 ile sınırlar ve mm birimini normalize eder', () => {
    const items = buildSpecRail(
      { ...base, thicknesses: ['8mm', '10mm', '12mm', '18mm'] },
      labels,
    );
    expect(items.find((i) => i.key === 'thickness')?.value).toBe('8 / 10 / 12 mm');
  });

  it('renkleri ilk 3 ile gösterip kalanı sayar', () => {
    const items = buildSpecRail({ ...base, colors: ['Meşe', 'Ceviz', 'Akçaağaç', 'Kayın'] }, labels);
    expect(items.find((i) => i.key === 'color')?.value).toBe('Meşe · Ceviz · Akçaağaç +1');
  });

  it('hiç veri yoksa boş dizi döner', () => {
    expect(buildSpecRail(base, labels)).toEqual([]);
  });

  it('en fazla 4 öğe döner', () => {
    const items = buildSpecRail(
      {
        ...base,
        face: 'Mat',
        thicknesses: ['8mm'],
        colors: ['Meşe'],
        code: 'BZ-1',
      },
      labels,
    );
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.key)).toEqual(['surface', 'thickness', 'color', 'code']);
  });
});

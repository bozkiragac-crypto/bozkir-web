import type { Product } from '@/types/product';

export type SpecKey = 'surface' | 'thickness' | 'color' | 'code';

export interface SpecItem {
  key: SpecKey;
  label: string;
  value: string;
}

export interface SpecLabels {
  surface: string;
  thickness: string;
  /** `dict.product.colors` — "Renkler" */
  color: string;
  code: string;
}

/** "8mm", "8 mm", "8" → "8". Birim zaten varsa korunur. */
function normalizeThickness(value: string): string {
  return value.replace(/\s*mm$/i, '').trim();
}

/**
 * Ürün kartı altındaki teknik ray: yalnız dolu alanlar, en fazla 4 öğe.
 * Boş alanlar sessizce atlanır (kartta boş etiket görünmez).
 */
export function buildSpecRail(product: Product, labels: SpecLabels): SpecItem[] {
  const out: SpecItem[] = [];

  if (product.face?.trim()) {
    out.push({ key: 'surface', label: labels.surface, value: product.face.trim() });
  }

  const thicknesses = product.thicknesses?.filter((t) => t.trim().length > 0) ?? [];
  if (thicknesses.length > 0) {
    const first = thicknesses.slice(0, 3);
    const cleaned = first.map(normalizeThickness);
    const unitless = cleaned.every((t) => /^\d+([.,]\d+)?$/.test(t));
    out.push({
      key: 'thickness',
      label: labels.thickness,
      value: unitless ? `${cleaned.join(' / ')} mm` : first.join(' / '),
    });
  }

  const colors = product.colors?.filter((c) => c.trim().length > 0) ?? [];
  if (colors.length > 0) {
    const shown = colors.slice(0, 3).join(' · ');
    out.push({
      key: 'color',
      label: labels.color,
      value: colors.length > 3 ? `${shown} +${colors.length - 3}` : shown,
    });
  }

  if (product.code?.trim()) {
    out.push({ key: 'code', label: labels.code, value: product.code.trim() });
  }

  return out.slice(0, 4);
}

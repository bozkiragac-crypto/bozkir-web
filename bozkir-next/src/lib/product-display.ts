import type { Locale } from '@/i18n/config';
import { fallbackCategories } from '@/data/categories';
import { categoryKeyOf } from '@/lib/data/category-key';
import { pickLocaleText } from '@/lib/locale-text';

/**
 * Ürünlerin kullanıcıya gösterim kuralları.
 *
 * Bu modül bilinçli olarak saf tutulur (DB/Next bağımlılığı yok): hem sunucu
 * veri katmanı (`lib/data/catalog.ts`) hem de client bileşenleri aynı kuralları
 * kullanır. Verinin kendisi değiştirilmez; yalnızca gösterim filtrelenir.
 */

/**
 * DB `face` alanı gerçek bir yüzey adı mı?
 *
 * Mevcut veride "1", "2", "3", "3 - İZMİT" gibi anlamsız değerler var. Sayıyla
 * başlayan değerler yüzey adı olarak kabul edilmez (veri silinmez, UI'da
 * gizlenir; ileride temizlenirse kendiliğinden görünür).
 */
export function isMeaningfulSurface(value?: string | null): boolean {
  const text = String(value ?? '').trim();
  if (!text) return false;
  return !/^\d/.test(text);
}

/**
 * DB `code` alanı gerçek bir ürün kodu mu?
 *
 * Kod alanı birçok üründe kategori adıyla doldurulmuş ("PVC", "MDF",
 * "Duvar Profili") veya tamamen metin ("(L)"). Gerçek kodlar rakam içerir
 * (ör. "YT-40C", "VT-025", "SGL-51A"). Kategori/ürün adıyla aynı olan değerler
 * kod olarak gösterilmez.
 */
export function isMeaningfulCode(
  code?: string | null,
  category?: string | null,
  name?: string | null,
): boolean {
  const value = String(code ?? '').trim();
  if (!value) return false;
  if (!/\d/.test(value)) return false;
  const key = categoryKeyOf(value);
  if (!key) return false;
  if (category && key === categoryKeyOf(category)) return false;
  if (name && key === categoryKeyOf(name)) return false;
  return true;
}

/** "18" / "18mm" / "18 mm" / " 18,0 " → "18 mm" (tanınmayan değerler olduğu gibi). */
export function normalizeThickness(value: string): string {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:mm)?$/i);
  if (!match) return text;
  const num = match[1]!.replace(',', '.');
  return `${Number(num)} mm`;
}

/**
 * Ürün adından kalınlık çıkarır: "18mm Ham" → ["18 mm"], "2,7mm Ham" → ["2.7 mm"].
 * Yalnızca adda açıkça yazan değer üretilir; uydurma veri yoktur.
 */
export function extractThickness(name?: string | null): string[] {
  const text = String(name ?? '').trim();
  if (!text) return [];
  const out: string[] = [];
  const re = /(\d+(?:[.,]\d+)?)\s*mm\b/gi;
  for (const match of text.matchAll(re)) {
    const normalized = normalizeThickness(`${match[1]} mm`);
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}

/** Kayıtlı kalınlıklara isimden türetilenleri ekler; normalize + tekilleştirir. */
export function mergeThicknesses(stored: string[], name?: string | null): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...stored, ...extractThickness(name)]) {
    const value = normalizeThickness(raw);
    if (!value) continue;
    const key = value.toLocaleLowerCase('tr').replace(/\s+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/**
 * Kategori için kanonik görünen ad.
 *
 * `products.cat` aynı kategoriyi "MDFLAM"/"MDF LAM", "SUNTALAM"/"SUNTA LAM"
 * gibi farklı yazımlarla tutar. Görünen ad kanonik slug üzerinden fallback
 * sözlüğünden (tr/en/ar) seçilir; sözlükte olmayan kategorilerde DB metni
 * (varsa çevirisiyle) kullanılır.
 */
export function categoryDisplayName(
  slug: string,
  rawName: string,
  locale?: Locale,
  rawNameEn?: string | null,
  rawNameAr?: string | null,
): string {
  const fallback = fallbackCategories.find((category) => category.slug === slug);
  if (fallback) {
    return pickLocaleText(fallback.name, locale, fallback.nameEn, fallback.nameAr);
  }
  return pickLocaleText(rawName, locale, rawNameEn, rawNameAr);
}

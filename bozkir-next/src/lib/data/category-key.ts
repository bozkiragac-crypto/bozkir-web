/**
 * Kategori metin eşleştemesinin tek doğruluk kaynağı.
 *
 * `products.cat` düz metindir (FK yok) ve aynı kategoriyi farklı yazımlarla
 * tutar: "PVC KENAR", "MDF LAM"/"MDFLAM", "LAK PANEL"/"LAKPANEL",
 * "DUVAR PROFİLİ", "TUTKAL"/"Tutkal". Hem `fetchCategories()` ürünlerden
 * kategori türetirken hem de kategori silme işlemi ürün sayımını yaparken
 * aynı normalizasyonu kullanmalı; aksi halde silinen kategori ürünlerden
 * geri doğar.
 */

/** Türkçe ve Arapça harfleri ASCII karşılıklarına indirger. */
export function toAscii(value: string): string {
  return value
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
}

/** "Duv ar Profili", "DUVAR PROFİLİ", "duvar-profili" → aynı anahtar. */
export function categoryKeyOf(value: string): string {
  return toAscii(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

/** Ürünlerde yazım farklılıklarıyla bulunan kategorilerin kanonik slug'ı. */
export const CATEGORY_SLUGS: Record<string, string> = {
  KAPLAMALIMDF: 'kaplamali-mdf',
  MDF: 'mdf',
  MDFLAM: 'mdflam',
  SUNTA: 'sunta',
  SUNTALAM: 'suntalam',
  LAKPANEL: 'lak-panel',
  MASIFPANEL: 'masif-panel',
  PVCKENAR: 'pvc-kenar-bant',
  PERVAZ: 'pervaz',
  TUTKAL: 'tutkal',
  KAPIPANEL: 'kapi-panel',
  OSB: 'osb',
  DUVARPROFILI: 'duvar-profili',
};

/** Serbest metinden URL uyumlu slug üretir. */
export function slugify(value: string): string {
  return toAscii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Serbest metinden kategori slug'ı üretir (bilinmeyse slugify). */
export function categorySlugOf(value: string): string {
  const key = categoryKeyOf(value);
  if (!key) return '';
  return CATEGORY_SLUGS[key] ?? slugify(value);
}

/** SQL karşılaştırması için büyük/küçük harf ve boşluk duyarsız desen. */
export function categoryNamePattern(value: string): string {
  // product.cat alanları DB'de "PVC KENAR" gibi düz metin; ILike ile
  // "pvc kenar" / "PVC  KENAR" gibi varyantları da yakalayabilmek için
  // ayraçları esnek bırakıyoruz.
  return value
    .trim()
    .replace(/[%_\\]/g, '')
    .replace(/\s+/g, '%');
}
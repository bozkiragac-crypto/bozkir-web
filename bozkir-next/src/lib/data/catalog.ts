import { and, desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { DATA_TAGS } from '@/lib/data/tags';
import type { Locale } from '@/i18n/config';
import type { Category } from '@/types/category';
import type { Product, ProductFacets, ProductFilters, ProductQueryResult } from '@/types/product';
import { fallbackCategories } from '@/data/categories';
import { deriveColors, localizeColor, translateDecorName } from '@/data/color-names';
import { buildProductContent } from '@/data/product-content';
import { getDb, hasDb } from '@/lib/db/client';
import { products as productsTable } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { pickLocaleText } from '@/lib/locale-text';
import {
  categoryDisplayName,
  isMeaningfulCode,
  isMeaningfulSurface,
  mergeThicknesses,
} from '@/lib/product-display';

import { categoryKeyOf, categorySlugOf, slugify, toAscii } from '@/lib/data/category-key';

/** Fallback kategori adını locale'e göre seçer. */
export function localizedCategoryName(category: Category, locale?: Locale): string {
  return pickLocaleText(category.name, locale, category.nameEn, category.nameAr);
}

function localizeFallbackCategories(locale?: Locale): Category[] {
  if (!locale || locale === 'tr') return fallbackCategories;
  return fallbackCategories.map((c) => ({ ...c, name: localizedCategoryName(c, locale) }));
}

export function parseImageList(raw: unknown): string[] {
  const value = String(raw ?? '').trim();
  if (!value) return [];
  if (value.startsWith('[')) {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr.map((v) => String(v).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  if (value.startsWith('data:')) return [value];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** JSONB teknik özellik satırlarını güvenli biçimde normalize eder. */
export function parseSpecList(raw: unknown): { label: string; value: string }[] {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      label: String((item as { label?: unknown })?.label ?? '').trim(),
      value: String((item as { value?: unknown })?.value ?? '').trim(),
    }))
    .filter((item) => item.label && item.value);
}

/** JSONB doküman listesini güvenli biçimde normalize eder. */
export function parseDocList(raw: unknown): { title: string; url: string }[] {
  let value = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      title: String((item as { title?: unknown })?.title ?? '').trim(),
      url: String((item as { url?: unknown })?.url ?? '').trim(),
    }))
    .filter((item) => item.title && item.url);
}

interface IndexItem {
  id: string;
  slug: string;
  name: string;
  code: string;
  category: string;
  categorySlug: string;
  face: string;
  colors: string[];
  thicknesses: string[];
  dimensions: string;
  applications: string[];
  shortDescription: string;
  description: string;
  descriptionEn: string;
  descriptionAr: string;
  technicalSpecs: { label: string; value: string }[];
  documents: { title: string; url: string }[];
  createdAt: string;
  /** Son güncelleme (ISO); sitemap `lastModified` için kullanılır. */
  updatedAt: string;
  images: string[];
  /** Çeviri alanları; boşsa Türkçeye düşer. Slug daima Türkçe isimden üretilir. */
  nameEn: string;
  nameAr: string;
  catEn: string;
  catAr: string;
  seoTitle: string;
  seoDescription: string;
  whatsappMessage: string;
  whatsappMessageEn: string;
  whatsappMessageAr: string;
}

interface RawRow {
  id: string;
  code: string | null;
  name: string | null;
  cat: string | null;
  face: string | null;
  colors?: string | null;
  thicknesses?: string | null;
  dimensions?: string | null;
  applications?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  technicalSpecs?: unknown;
  documents?: unknown;
  img: string | null;
  createdAt: Date | string | null;
  updatedAt?: Date | string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  catEn?: string | null;
  catAr?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  whatsappMessage?: string | null;
  whatsappMessageEn?: string | null;
  whatsappMessageAr?: string | null;
}

function buildIndex(rows: RawRow[]): IndexItem[] {
  const out: IndexItem[] = [];
  const usedSlugs = new Map<string, number>();

  for (const row of rows) {
    const name = String(row.name ?? '').trim();
    const code = String(row.code ?? '').trim();
    const cat = String(row.cat ?? '').trim();
    if (!name || !cat) continue;
    // Yalnızca code + name + kategori aynıysa (gerçek placeholder) atla.
    // code kategoriyle aynı olsa da farklı isimli ürünler (örn. "Duvar Profili")
    // geçerli ürünlerdir; elenmemeli.
    if (
      code &&
      categoryKeyOf(code) === categoryKeyOf(cat) &&
      categoryKeyOf(name) === categoryKeyOf(cat)
    )
      continue;

    // Slug yalnızca Türkçe isimden üretilir; çeviriler URL'yi değiştirmez.
    let slug = slugify(code ? `${name}-${code}` : name);
    if (!slug) continue;
    const seen = usedSlugs.get(slug) ?? 0;
    usedSlugs.set(slug, seen + 1);
    if (seen > 0) slug = `${slug}-${seen + 1}`;

    out.push({
      id: String(row.id),
      slug,
      name,
      code,
      category: cat,
      categorySlug: categorySlugOf(cat),
      face: String(row.face ?? '').trim(),
      colors: deriveColors(parseImageList(row.colors), name),
      thicknesses: mergeThicknesses(parseImageList(row.thicknesses), name),
      dimensions: String(row.dimensions ?? '').trim(),
      applications: parseImageList(row.applications),
      shortDescription: String(row.shortDescription ?? '').trim(),
      description: String(row.description ?? '').trim(),
      descriptionEn: String(row.descriptionEn ?? '').trim(),
      descriptionAr: String(row.descriptionAr ?? '').trim(),
      technicalSpecs: parseSpecList(row.technicalSpecs),
      documents: parseDocList(row.documents),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : '',
      images: parseImageList(row.img),
      nameEn: String(row.nameEn ?? '').trim(),
      nameAr: String(row.nameAr ?? '').trim(),
      catEn: String(row.catEn ?? '').trim(),
      catAr: String(row.catAr ?? '').trim(),
      seoTitle: String(row.seoTitle ?? '').trim(),
      seoDescription: String(row.seoDescription ?? '').trim(),
      whatsappMessage: String(row.whatsappMessage ?? '').trim(),
      whatsappMessageEn: String(row.whatsappMessageEn ?? '').trim(),
      whatsappMessageAr: String(row.whatsappMessageAr ?? '').trim(),
    });
  }
  return out;
}

// DB okuması etiketli önbelleğe alınır; admin yazınca `revalidateTag('products')`
// ile tazelenir. Böylece her navigasyonda DB'ye gidilmez.
const getProductsIndexCached = unstable_cache(
  async (): Promise<IndexItem[]> => {
    const db = getDb()!;
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .orderBy(desc(productsTable.createdAt));
    return buildIndex(rows as RawRow[]);
  },
  ['products:index'],
  { tags: [DATA_TAGS.products], revalidate: 300 },
);

export async function getProductsIndex(): Promise<IndexItem[]> {
  if (!hasDb()) return [];
  try {
    return await getProductsIndexCached();
  } catch {
    return [];
  }
}

/** Locale için çeviri metni seçer; çeviri boşsa Türkçeye düşer. */
export { pickLocaleText } from '@/lib/locale-text';

function toProduct(item: IndexItem, locale?: Locale): Product {
  const images = item.images.map((value) => publicUrl(value));
  // Ürün adı bir renk/ahşap adıysa görüntüde çevrilir; marka/seri adları korunur.
  const localizedName = pickLocaleText(item.name, locale, item.nameEn, item.nameAr);
  const name = localizedName === item.name ? translateDecorName(item.name, locale) : localizedName;
  const colors = item.colors.map((color) => localizeColor(color, locale));

  const base: Product = {
    id: item.id,
    slug: item.slug,
    name,
    code: isMeaningfulCode(item.code, item.category, item.name) ? item.code : undefined,
    category: categoryDisplayName(item.categorySlug, item.category, locale, item.catEn, item.catAr),
    categorySlug: item.categorySlug,
    updatedAt: item.updatedAt || undefined,
    face: isMeaningfulSurface(item.face) ? item.face : undefined,
    colors: colors.length > 0 ? colors : undefined,
    thicknesses: item.thicknesses,
    dimensions: item.dimensions || undefined,
    applications: item.applications.length > 0 ? item.applications : undefined,
    shortDescription: item.shortDescription || undefined,
    description:
      pickLocaleText(item.description, locale, item.descriptionEn, item.descriptionAr) || undefined,
    technicalSpecs: item.technicalSpecs.length > 0 ? item.technicalSpecs : undefined,
    documents: item.documents.length > 0 ? item.documents : undefined,
    images,
    thumbnail: images[0],
    seoTitle: item.seoTitle || undefined,
    seoDescription: item.seoDescription || undefined,
    whatsappMessage:
      pickLocaleText(
        item.whatsappMessage,
        locale,
        item.whatsappMessageEn,
        item.whatsappMessageAr,
      ) || undefined,
  };

  // Boş içerik alanları kategori şablonuyla doldurulur; admin verisi ezilmez.
  return { ...base, ...buildProductContent(base, locale) };
}

/** Verilen ID'leri istenen sırada döndürür; bulunmayan/pasif ürünler atlanır. */
export async function fetchProductsByIds(ids: string[], locale?: Locale): Promise<Product[]> {
  const wanted = ids.map((id) => String(id).trim()).filter(Boolean);
  if (wanted.length === 0) return [];
  const index = await getProductsIndex();
  const byId = new Map(index.map((item) => [item.id, item]));
  return wanted
    .map((id) => byId.get(id))
    .filter((item): item is IndexItem => !!item)
    .map((item) => toProduct(item, locale));
}

/** Verilen slug'ları istenen sırada döndürür; bulunmayan/pasif ürünler atlanır. */
export async function fetchProductsBySlugs(slugs: string[], locale?: Locale): Promise<Product[]> {
  const wanted = slugs.map((slug) => String(slug).trim()).filter(Boolean);
  if (wanted.length === 0) return [];
  const index = await getProductsIndex();
  const bySlug = new Map(index.map((item) => [item.slug, item]));
  return wanted
    .map((slug) => bySlug.get(slug))
    .filter((item): item is IndexItem => !!item)
    .map((item) => toProduct(item, locale));
}

/** Arama için sadeleştirme: aksan düşür, boşluk/noktalama ayıkl. */
function normSearch(value: string): string {
  return toAscii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** "8 mm" < "10 mm" < "18 mm": sayısal önek varsa ona göre, yoksa alfabetik. */
export function sortFacetValues(values: string[]): string[] {
  const numOf = (value: string) => {
    const match = value.match(/^\s*(\d+(?:[.,]\d+)?)/);
    return match ? Number(match[1]!.replace(',', '.')) : Number.NaN;
  };
  return [...values].sort((a, b) => {
    const na = numOf(a);
    const nb = numOf(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
    return a.localeCompare(b, 'tr');
  });
}

/**
 * Facet değerlerini normalize ederek tekilleştirir (ilk yazım korunur).
 * "18 mm" / "18MM" / " 18 mm " tek değere iner.
 */
export function collectFacetValues(values: string[]): string[] {
  const byNorm = new Map<string, string>();
  for (const raw of values) {
    const value = String(raw ?? '').trim();
    if (!value) continue;
    const key = normSearch(value);
    if (key && !byNorm.has(key)) byNorm.set(key, value);
  }
  return sortFacetValues([...byNorm.values()]);
}

/** Facet listesinde (ör. renk/kalınlık) normalize eşleşme arar. */
export function facetMatches(values: string[] | undefined, needle: string): boolean {
  const target = normSearch(needle);
  if (!target) return true;
  return (values ?? []).some((value) => normSearch(value) === target);
}

export async function fetchProducts(
  filters: ProductFilters = {},
  locale?: Locale,
): Promise<ProductQueryResult> {
  let items = await getProductsIndex();

  if (filters.category) items = items.filter((i) => i.categorySlug === filters.category);
  if (filters.surface) {
    const needle = normSearch(filters.surface);
    items = items.filter((i) => isMeaningfulSurface(i.face) && normSearch(i.face) === needle);
  }
  if (filters.thickness) {
    const thickness = filters.thickness;
    items = items.filter((i) => facetMatches(i.thicknesses, thickness));
  }
  if (filters.color) {
    const color = filters.color;
    items = items.filter((i) => facetMatches(i.colors, color));
  }
  if (filters.query) {
    const raw = toAscii(filters.query).toLowerCase().trim();
    // Çoklu kelime: tüm parçalar eşleşmeli ("lak panel bej").
    const tokens = raw.split(/[^a-z0-9]+/).filter(Boolean);
    // Arama hem Türkçe hem çeviri metinlerinde çalışır.
    const hayOf = (i: IndexItem) =>
      toAscii(
        `${i.name} ${i.code} ${i.category} ${i.nameEn} ${i.nameAr} ${i.catEn} ${i.catAr} ${isMeaningfulSurface(i.face) ? i.face : ''} ${i.colors.join(' ')} ${i.thicknesses.join(' ')}`,
      ).toLowerCase();
    if (tokens.length > 1) {
      items = items.filter((i) => {
        const hay = hayOf(i);
        return tokens.every((t) => hay.includes(t));
      });
    } else if (tokens.length === 1) {
      // Tek kelime: boşluk duyarsız ("lakpanel" → "LAK PANEL", "mdflam").
      const needle = tokens[0]!;
      items = items.filter((i) => normSearch(hayOf(i)).includes(needle));
    }
  }

  const mapped = items.map((i) => toProduct(i, locale));

  // Sıralama: varsayılan en yeni (index zaten created_at DESC).
  if (filters.sort === 'name-asc') {
    mapped.sort((a, b) => a.name.localeCompare(b.name, locale ?? 'tr'));
  } else if (filters.sort === 'name-desc') {
    mapped.sort((a, b) => b.name.localeCompare(a.name, locale ?? 'tr'));
  } else if (filters.sort === 'code-asc') {
    mapped.sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '', 'tr'));
  }

  const total = mapped.length;
  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 24));
  const page = mapped.slice(offset, offset + limit);

  return { items: page, total };
}

export async function fetchProductBySlug(slug: string, locale?: Locale): Promise<Product | null> {
  const items = await getProductsIndex();
  const found = items.find((i) => i.slug === slug);
  return found ? toProduct(found, locale) : null;
}

/** Aynı kategoriden ilgili ürünler (mevcut ürün hariç, en fazla `limit`). */
export async function fetchRelatedProducts(
  slug: string,
  locale?: Locale,
  limit = 4,
): Promise<Product[]> {
  const items = await getProductsIndex();
  const current = items.find((i) => i.slug === slug);
  if (!current) return [];
  return items
    .filter((i) => i.categorySlug === current.categorySlug && i.slug !== slug)
    .slice(0, limit)
    .map((i) => toProduct(i, locale));
}

export async function fetchCategories(locale?: Locale): Promise<Category[]> {
  const items = await getProductsIndex();
  // Tüm meta satırları okunur (pasifler dahil): aksi halde pasifleştirilen
  // kategori meta satırı görünmez ve `items`'dan yeniden üretilir.
  const { fetchAllCategoryMeta } = await import('@/lib/data/categories');
  const allMeta = await fetchAllCategoryMeta(locale);
  const hiddenSlugs = new Set(allMeta.filter((c) => c.isActive === false).map((c) => c.slug));
  const dbMeta = allMeta.filter((c) => c.isActive !== false);
  const metaBySlug = new Map(dbMeta.map((c) => [c.slug, c]));

  const counts = new Map<string, { name: string; count: number }>();
  for (const it of items) {
    if (!it.categorySlug) continue;
    // Panelden gizlenen kategori ürünü olsa bile vitrinde görünmez.
    if (hiddenSlugs.has(it.categorySlug)) continue;
    const localized = pickLocaleText(it.category, locale, it.catEn, it.catAr);
    const cur = counts.get(it.categorySlug);
    if (cur) cur.count += 1;
    else counts.set(it.categorySlug, { name: localized, count: 1 });
  }
  if (counts.size === 0 && dbMeta.length === 0) return localizeFallbackCategories(locale);

  const merged: Category[] = [];
  counts.forEach((value, slug) => {
    const meta = metaBySlug.get(slug);
    const fb = fallbackCategories.find((f) => f.slug === slug);
    merged.push({
      id: slug,
      slug,
      name: meta?.name ?? (fb ? localizedCategoryName(fb, locale) : value.name),
      nameEn: meta?.nameEn ?? fb?.nameEn,
      nameAr: meta?.nameAr ?? fb?.nameAr,
      description: meta?.description ?? fb?.description ?? '',
      shortDescription: meta?.shortDescription ?? fb?.shortDescription,
      thumbnail: meta?.thumbnail ?? fb?.thumbnail,
      heroImage: meta?.heroImage ?? fb?.heroImage,
      featured: meta?.featured ?? fb?.featured,
      sortOrder: meta?.sortOrder ?? fb?.sortOrder,
      productCount: value.count,
    });
  });

  // DB'de tanımlı ama ürünü olmayan aktif kategoriler de listelensin.
  for (const meta of dbMeta) {
    if (!counts.has(meta.slug)) merged.push({ ...meta, productCount: 0 });
  }

  return merged.sort(
    (a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.name.localeCompare(b.name, 'tr'),
  );
}

/** Tek ürünün ham görsel alanı (legacy /api/image fallback için). */
export async function fetchProductImageRaw(id: string): Promise<string> {
  if (!hasDb()) return '';
  try {
    const db = getDb()!;
    const rows = await db
      .select({ img: productsTable.img })
      .from(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.isActive, true)))
      .limit(1);
    return rows[0]?.img ? String(rows[0].img) : '';
  } catch {
    return '';
  }
}

/** Filtre paneli için mevcut facet değerleri (yüzey, kalınlık, renk). */
export async function fetchProductFacets(): Promise<ProductFacets> {
  const items = await getProductsIndex();
  return {
    surfaces: collectFacetValues(
      items.filter((i) => isMeaningfulSurface(i.face)).map((i) => i.face),
    ),
    thicknesses: collectFacetValues(items.flatMap((i) => i.thicknesses)),
    colors: collectFacetValues(items.flatMap((i) => i.colors)),
  };
}

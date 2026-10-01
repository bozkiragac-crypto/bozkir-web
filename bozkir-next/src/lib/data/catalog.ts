import { desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { DATA_TAGS } from '@/lib/data/tags';
import type { Locale } from '@/i18n/config';
import type { Category } from '@/types/category';
import type { Product, ProductFilters, ProductQueryResult } from '@/types/product';
import { fallbackCategories, primaryCategorySlugs } from '@/data/categories';
import { getDb, hasDb } from '@/lib/db/client';
import { products as productsTable } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { pickLocaleText } from '@/lib/locale-text';

const CATEGORY_SLUGS: Record<string, string> = {
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

function toAscii(value: string): string {
  return value
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c');
}

function catKey(value: string): string {
  return toAscii(value).toUpperCase().replace(/[^A-Z0-9]+/g, '');
}

function slugify(value: string): string {
  return toAscii(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function categorySlug(cat: string): string {
  const key = catKey(cat);
  return CATEGORY_SLUGS[key] ?? slugify(cat);
}

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
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

interface IndexItem {
  id: string;
  slug: string;
  name: string;
  code: string;
  category: string;
  categorySlug: string;
  face: string;
  createdAt: string;
  images: string[];
  /** Çeviri alanları; boşsa Türkçeye düşer. Slug daima Türkçe isimden üretilir. */
  nameEn: string;
  nameAr: string;
  catEn: string;
  catAr: string;
  seoTitle: string;
  seoDescription: string;
}

interface RawRow {
  id: string;
  code: string | null;
  name: string | null;
  cat: string | null;
  face: string | null;
  img: string | null;
  createdAt: Date | string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  catEn?: string | null;
  catAr?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
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
    if (code && catKey(code) === catKey(cat) && catKey(name) === catKey(cat)) continue;

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
      categorySlug: categorySlug(cat),
      face: String(row.face ?? '').trim(),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
      images: parseImageList(row.img),
      nameEn: String(row.nameEn ?? '').trim(),
      nameAr: String(row.nameAr ?? '').trim(),
      catEn: String(row.catEn ?? '').trim(),
      catAr: String(row.catAr ?? '').trim(),
      seoTitle: String(row.seoTitle ?? '').trim(),
      seoDescription: String(row.seoDescription ?? '').trim(),
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
  return {
    id: item.id,
    slug: item.slug,
    name: pickLocaleText(item.name, locale, item.nameEn, item.nameAr),
    code: item.code,
    category: pickLocaleText(item.category, locale, item.catEn, item.catAr),
    categorySlug: item.categorySlug,
    face: item.face,
    images,
    thumbnail: images[0],
    seoTitle: item.seoTitle || undefined,
    seoDescription: item.seoDescription || undefined,
  };
}

/** Arama için sadeleştirme: aksan düşür, boşluk/noktalama ayıkl. */
function normSearch(value: string): string {
  return toAscii(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export async function fetchProducts(
  filters: ProductFilters = {},
  locale?: Locale,
): Promise<ProductQueryResult> {
  let items = await getProductsIndex();

  if (filters.category) items = items.filter((i) => i.categorySlug === filters.category);
  if (filters.query) {
    const raw = toAscii(filters.query).toLowerCase().trim();
    // Çoklu kelime: tüm parçalar eşleşmeli ("lak panel bej").
    const tokens = raw.split(/[^a-z0-9]+/).filter(Boolean);
    // Arama hem Türkçe hem çeviri metinlerinde çalışır.
    const hayOf = (i: IndexItem) =>
      toAscii(`${i.name} ${i.code} ${i.category} ${i.nameEn} ${i.nameAr} ${i.catEn} ${i.catAr}`).toLowerCase();
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
export async function fetchRelatedProducts(slug: string, locale?: Locale, limit = 4): Promise<Product[]> {
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
  // DB kategori meta verisi (varsa) fallback'in önüne geçer.
  const { fetchCategoryMeta } = await import('@/lib/data/categories');
  const dbMeta = await fetchCategoryMeta(locale);
  const metaBySlug = new Map(dbMeta.map((c) => [c.slug, c]));

  const counts = new Map<string, { name: string; count: number }>();
  for (const it of items) {
    if (!it.categorySlug) continue;
    const localized = pickLocaleText(it.category, locale, it.catEn, it.catAr);
    const cur = counts.get(it.categorySlug);
    if (cur) cur.count += 1;
    else counts.set(it.categorySlug, { name: localized, count: 1 });
  }
  if (counts.size === 0) return dbMeta.length ? dbMeta : localizeFallbackCategories(locale);

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

  return merged.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99) || a.name.localeCompare(b.name, 'tr'));
}

export async function fetchPrimaryCategories(): Promise<Category[]> {
  const all = await fetchCategories();
  const order = new Map(primaryCategorySlugs.map((slug, i) => [slug, i]));
  return all
    .filter((c) => order.has(c.slug))
    .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
}

/** Tek ürünün ham görsel alanı (legacy /api/image fallback için). */
export async function fetchProductImageRaw(id: string): Promise<string> {
  if (!hasDb()) return '';
  try {
    const db = getDb()!;
    const rows = await db
      .select({ img: productsTable.img })
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);
    return rows[0]?.img ? String(rows[0].img) : '';
  } catch {
    return '';
  }
}

import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { campaigns, catalogs, categories, contentItems, products } from '@/lib/db/schema';
import { TranslationEditor, type TranslationGroup } from '@/components/admin/TranslationEditor';

export const dynamic = 'force-dynamic';

function missing(...values: (string | null | undefined)[]): boolean {
  return values.some((v) => !v || !String(v).trim());
}

export default async function TranslationsAdminPage() {
  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const [p, c, cmp, cat, ci] = await Promise.all([
    db.select().from(products).orderBy(asc(products.createdAt)),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(campaigns).orderBy(asc(campaigns.sortOrder)),
    db.select().from(catalogs).orderBy(asc(catalogs.sortOrder)),
    db.select().from(contentItems).orderBy(asc(contentItems.sortOrder)),
  ]);

  const groups: TranslationGroup[] = [
    {
      kind: 'product',
      title: 'Ürünler',
      field1: 'nameEn',
      field2: 'catEn',
      rows: p
        .filter((r) => missing(r.nameEn, r.nameAr) || missing(r.catEn, r.catAr))
        .map((r) => ({
          id: r.id,
          tr: r.name,
          trAlt: `${r.cat}${r.code ? ` · ${r.code}` : ''}`,
          en: r.nameEn ?? '',
          ar: r.nameAr ?? '',
          en2: r.catEn ?? '',
          ar2: r.catAr ?? '',
        })),
    },
    {
      kind: 'category',
      title: 'Kategoriler',
      field1: 'nameEn',
      rows: c
        .filter((r) => missing(r.nameEn, r.nameAr))
        .map((r) => ({ id: r.id, tr: r.name, trAlt: r.slug, en: r.nameEn ?? '', ar: r.nameAr ?? '' })),
    },
    {
      kind: 'campaign',
      title: 'Kampanyalar',
      field1: 'titleEn',
      rows: cmp
        .filter((r) => missing(r.titleEn, r.titleAr))
        .map((r) => ({ id: r.id, tr: r.title, en: r.titleEn ?? '', ar: r.titleAr ?? '' })),
    },
    {
      kind: 'catalog',
      title: 'Kataloglar',
      field1: 'titleEn',
      rows: cat
        .filter((r) => missing(r.titleEn, r.titleAr))
        .map((r) => ({ id: r.id, tr: r.title, en: r.titleEn ?? '', ar: r.titleAr ?? '' })),
    },
    {
      kind: 'content',
      title: 'İçerik Öğeleri',
      field1: 'titleEn',
      rows: ci
        .filter((r) => (r.title ?? '').trim() && missing(r.titleEn, r.titleAr))
        .map((r) => ({ id: r.id, tr: r.title ?? '', trAlt: r.blockKey, en: r.titleEn ?? '', ar: r.titleAr ?? '' })),
    },
  ];

  const total = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Toplu Çeviri</h1>
      <p className="mt-1 text-sm text-muted-strong">
        EN/AR alanları eksik kayıtlar. Boş bırakılan çeviriler sitede Türkçe olarak gösterilir. Toplam {total} eksik kayıt.
      </p>
      <div className="mt-8">
        <TranslationEditor groups={groups} />
      </div>
    </div>
  );
}

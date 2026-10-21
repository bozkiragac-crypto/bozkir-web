import { asc, ilike, inArray, or } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { parseImageField } from '@/lib/media';
import { publicUrl } from '@/lib/storage/s3';
import { getSiteSettingsFresh } from '@/lib/data/settings';
import { FeaturedProductsEditor } from '@/components/admin/FeaturedProductsEditor';

export const dynamic = 'force-dynamic';

const SEARCH_LIMIT = 50;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

export default async function FeaturedProductsAdminPage({ searchParams }: PageProps) {
  const db = getDb();
  if (!db) {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        Veritabanı bağlantısı yok.
      </p>
    );
  }

  const sp = await searchParams;
  const q = str(sp.q).trim();
  const settings = await getSiteSettingsFresh();
  const selectedIds = settings.featuredProducts;

  const selectFields = {
    id: products.id,
    name: products.name,
    code: products.code,
    cat: products.cat,
    img: products.img,
    isActive: products.isActive,
  };

  const [selectedRows, searchRows] = await Promise.all([
    selectedIds.length
      ? db.select(selectFields).from(products).where(inArray(products.id, selectedIds))
      : Promise.resolve([]),
    q
      ? db
          .select(selectFields)
          .from(products)
          .where(
            or(
              ilike(products.name, `%${q}%`),
              ilike(products.code, `%${q}%`),
              ilike(products.cat, `%${q}%`),
            ),
          )
          .orderBy(asc(products.name))
          .limit(SEARCH_LIMIT)
      : Promise.resolve([]),
  ]);

  // Seçili ürünler önce gelsin; arama sonuçları tekilleştirilsin.
  const byId = new Map<
    string,
    {
      id: string;
      name: string;
      code: string;
      cat: string;
      img: string | null;
      isActive: boolean;
    }
  >();
  for (const row of [...selectedRows, ...searchRows]) byId.set(row.id, row);

  const options = [...byId.values()].map((row) => {
    const first = parseImageField(row.img ?? '')[0];
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      cat: row.cat,
      thumb: first ? publicUrl(first) : null,
      isActive: row.isActive,
    };
  });
  const known = new Set(options.map((option) => option.id));

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Öne Çıkan Ürünler</h1>
      <p className="mt-1 text-sm text-muted-strong">
        Ana sayfada gösterilecek ürünleri seçin ve sıralayın. Pasif ürünler kaydedilirken çıkarılır.
      </p>
      <div className="mt-8">
        <FeaturedProductsEditor
          products={options}
          initialIds={selectedIds.filter((id) => known.has(id))}
          initialQuery={q}
        />
      </div>
    </div>
  );
}

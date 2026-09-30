import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { parseImageField } from '@/lib/media';
import { publicUrl } from '@/lib/storage/s3';
import { ProductsTable } from '@/components/admin/ProductsTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = str(sp.q).trim();
  const cat = str(sp.kategori).trim();
  const durum = str(sp.durum, 'all');
  const sort = str(sp.sirala, 'new');
  const page = Math.max(1, parseInt(str(sp.sayfa, '1'), 10) || 1);

  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const conditions: SQL[] = [];
  if (q) conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.code, `%${q}%`))!);
  if (cat) conditions.push(eq(products.cat, cat));
  if (durum === 'active') conditions.push(eq(products.isActive, true));
  if (durum === 'passive') conditions.push(eq(products.isActive, false));
  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy = sort === 'code' ? asc(products.code) : sort === 'name' ? asc(products.name) : desc(products.createdAt);

  const [rows, [totalRow], catRows] = await Promise.all([
    db
      .select({ id: products.id, code: products.code, name: products.name, cat: products.cat, face: products.face, img: products.img, isActive: products.isActive })
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(products).where(where),
    db.selectDistinct({ cat: products.cat }).from(products).orderBy(asc(products.cat)),
  ]);

  const total = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ProductsTable
      rows={rows.map((p) => {
        const first = parseImageField(p.img ?? '')[0];
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          cat: p.cat,
          face: p.face,
          thumb: first ? publicUrl(first) : null,
          isActive: p.isActive,
        };
      })}
      cats={catRows.map((c) => c.cat)}
      total={total}
      page={page}
      totalPages={totalPages}
      filters={{ q, cat, durum, sort }}
    />
  );
}

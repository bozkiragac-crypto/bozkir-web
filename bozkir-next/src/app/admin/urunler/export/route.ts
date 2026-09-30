import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { getCurrentAdmin } from '@/lib/admin/guard';
import { parseImageField } from '@/lib/media';
import { csvCell as cell } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response('yetkisiz', { status: 401 });

  const db = getDb();
  if (!db) return new Response('veritabanı yok', { status: 503 });

  const sp = new URL(request.url).searchParams;
  const q = sp.get('q')?.trim() ?? '';
  const cat = sp.get('kategori')?.trim() ?? '';
  const durum = sp.get('durum') ?? 'all';

  const conditions: SQL[] = [];
  if (q) conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.code, `%${q}%`))!);
  if (cat) conditions.push(eq(products.cat, cat));
  if (durum === 'active') conditions.push(eq(products.isActive, true));
  if (durum === 'passive') conditions.push(eq(products.isActive, false));

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(products.code));

  const header = 'code,name,cat,face,img,is_active,name_en,name_ar,cat_en,cat_ar';
  const lines = rows.map((r) => {
    const img = parseImageField(r.img ?? '').join('|');
    return [r.code, r.name, r.cat, r.face ?? '', img, r.isActive ? '1' : '0', r.nameEn ?? '', r.nameAr ?? '', r.catEn ?? '', r.catAr ?? '']
      .map(cell)
      .join(',');
  });

  const csv = '\uFEFF' + [header, ...lines].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="urunler-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

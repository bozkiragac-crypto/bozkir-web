import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';
import { getCurrentAdmin } from '@/lib/admin/guard';
import { csvCell } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;

function quoteFilters(status: string, q: string): SQL | undefined {
  const conds: SQL[] = [];
  if ((STATUSES as readonly string[]).includes(status)) {
    conds.push(eq(quoteRequests.status, status));
  }
  if (q) {
    const like = `%${q}%`;
    const search = or(
      ilike(quoteRequests.fullName, like),
      ilike(quoteRequests.company, like),
      ilike(quoteRequests.email, like),
      ilike(quoteRequests.phone, like),
      ilike(quoteRequests.product, like),
    );
    if (search) conds.push(search);
  }
  return conds.length ? and(...conds) : undefined;
}

/** Yöneticiye özel teklif CSV dışa aktarımı; aktif filtreleri korur. */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse('yetkisiz', { status: 401 });

  const db = getDb();
  if (!db) return new NextResponse('veritabanı yok', { status: 503 });

  const params = new URL(request.url).searchParams;
  const status = params.get('durum') ?? '';
  const q = (params.get('q') ?? '').trim();

  const rows = await db
    .select()
    .from(quoteRequests)
    .where(quoteFilters(status, q))
    .orderBy(desc(quoteRequests.createdAt));

  const header = [
    'Tarih',
    'Ad Soyad',
    'Firma',
    'Telefon',
    'E-posta',
    'Ürün',
    'Adet',
    'Ölçü',
    'Durum',
    'Not',
    'Dahili Not',
    'Ek Dosya',
  ];

  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.createdAt ? new Date(r.createdAt).toISOString() : '',
        r.fullName,
        r.company,
        r.phone,
        r.email,
        r.product,
        r.quantity,
        r.dimensions,
        r.status,
        r.note,
        r.internalNote,
        r.attachmentName,
      ]
        .map(csvCell)
        .join(','),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="teklifler-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

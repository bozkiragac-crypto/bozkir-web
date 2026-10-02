import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { activityLog } from '@/lib/db/schema';
import { getCurrentAdmin } from '@/lib/admin/guard';
import { csvCell } from '@/lib/csv';
import { ACTION_LABEL, activityWhere, parseActivityFilters } from '@/lib/activity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Yöneticiye özel aktivite CSV dışa aktarımı; aktif filtreleri korur. */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse('yetkisiz', { status: 401 });

  const db = getDb();
  if (!db) return new NextResponse('veritabanı yok', { status: 503 });

  const params = new URL(request.url).searchParams;
  const sp: Record<string, string> = {};
  for (const [k, v] of params) sp[k] = v;
  const filters = parseActivityFilters(sp);

  const rows = await db
    .select()
    .from(activityLog)
    .where(activityWhere(filters))
    .orderBy(desc(activityLog.createdAt))
    .limit(10000);

  const lines = [['Tarih', 'Kullanıcı', 'İşlem', 'Varlık', 'Açıklama'].map(csvCell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.createdAt ? new Date(r.createdAt).toISOString() : '',
        r.username,
        ACTION_LABEL[r.action] ?? r.action,
        r.entity,
        r.summary,
      ]
        .map(csvCell)
        .join(','),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aktivite-${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

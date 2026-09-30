import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';
import { getCurrentAdmin } from '@/lib/admin/guard';
import { getObject, storageConfigured } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Yöneticiye özel teklif eki indirme (S3'ten akıtır; public değildir). */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse('yetkisiz', { status: 401 });

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) return new NextResponse('id gerekli', { status: 400 });

  const db = getDb();
  if (!db) return new NextResponse('veritabanı yok', { status: 503 });

  const rows = await db
    .select({ key: quoteRequests.attachmentKey, name: quoteRequests.attachmentName })
    .from(quoteRequests)
    .where(eq(quoteRequests.id, id))
    .limit(1);
  const row = rows[0];
  if (!row?.key) return new NextResponse('ek bulunamadı', { status: 404 });
  if (!storageConfigured()) return new NextResponse('depolama yok', { status: 503 });

  try {
    const { bytes, contentType } = await getObject(row.key);
    const filename = (row.name ?? 'ek').replace(/[\r\n"]/g, '');
    return new NextResponse(bytes as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return new NextResponse('ek okunamadı', { status: 500 });
  }
}

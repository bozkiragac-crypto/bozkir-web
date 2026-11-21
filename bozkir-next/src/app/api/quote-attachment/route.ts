import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';
import { getCurrentAdmin } from '@/lib/admin/guard';
import { getObject, storageConfigured, toObjectKey } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Yöneticiye özel teklif eki indirme (S3'ten akıtır; public değildir). */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse('yetkisiz', { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const id = (new URL(request.url).searchParams.get('id') ?? '').trim();
  if (!UUID_RE.test(id)) {
    return new NextResponse('id geçersiz', { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const db = getDb();
  if (!db) return new NextResponse('veritabanı yok', { status: 503, headers: { 'Cache-Control': 'no-store' } });

  const rows = await db
    .select({ key: quoteRequests.attachmentKey, name: quoteRequests.attachmentName })
    .from(quoteRequests)
    .where(eq(quoteRequests.id, id))
    .limit(1);
  const row = rows[0];
  if (!row?.key) return new NextResponse('ek bulunamadı', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (!storageConfigured()) return new NextResponse('depolama yok', { status: 503, headers: { 'Cache-Control': 'no-store' } });

  const objectKey = toObjectKey(row.key);
  if (!objectKey || !objectKey.startsWith('quotes/')) {
    return new NextResponse('ek bulunamadı', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const { bytes, contentType } = await getObject(objectKey);
    const base = (row.name ?? 'ek').replace(/[\r\n"\\]/g, '').trim() || 'ek';
    const ascii = base.replace(/[^\x20-\x7E]/g, '_').slice(-120) || 'ek';
    const encoded = encodeURIComponent(base).slice(0, 300);
    return new NextResponse(bytes as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('ek okunamadı', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

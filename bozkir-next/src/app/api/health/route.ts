import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb, hasDb } from '@/lib/db/client';
import { ensureBucket, storageConfigured } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startedAt = Date.now();

async function checkDb(): Promise<'ok' | 'down' | 'unconfigured'> {
  if (!hasDb()) return 'unconfigured';
  const db = getDb();
  if (!db) return 'unconfigured';
  try {
    await db.execute(sql`select 1`);
    return 'ok';
  } catch {
    return 'down';
  }
}

async function checkStorage(): Promise<'ok' | 'down' | 'unconfigured'> {
  if (!storageConfigured()) return 'unconfigured';
  try {
    await ensureBucket();
    return 'ok';
  } catch {
    return 'down';
  }
}

/**
 * sharp gerçekten çalışıyor mu?
 *
 * sharp, mimariye bağlı önceden derlenmiş ikili getirir; uyumsuz mimaride
 * `npm ci` sessizce atlar ve dönüşüm hataları `optimizeImage` içinde yutulur.
 * Sonuç: yüklemeler JPEG olarak kalır ama panel hiçbir hata göstermez.
 * Bu probla sessiz arızanın görünür olmasını sağlar.
 */
async function checkImage(): Promise<'ok' | 'down'> {
  try {
    const sharp = (await import('sharp')).default;
    await sharp({ create: { width: 2, height: 2, channels: 3, background: '#000' } })
      .webp()
      .toBuffer();
    return 'ok';
  } catch {
    return 'down';
  }
}

/**
 * Sağlık ucu.
 * - Varsayılan (hafif): süreç ayakta mı → uptime izleme/healthcheck için.
 * - `?deep=1`: DB, nesne depolama ve sharp'ı da gerçekten yoklar; biri düşükse 503.
 */
export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get('deep') === '1';

  const base = {
    ok: true,
    ts: Date.now(),
    uptime: Math.round((Date.now() - startedAt) / 1000),
    version:
      process.env.APP_VERSION ??
      process.env.NEXT_PUBLIC_APP_VERSION ??
      process.env.GIT_SHA ??
      'dev',
  };

  if (!deep) {
    return NextResponse.json(base, { headers: { 'Cache-Control': 'no-store' } });
  }

  const [db, storage, image] = await Promise.all([checkDb(), checkStorage(), checkImage()]);
  const ok = db !== 'down' && storage !== 'down' && image !== 'down';

  return NextResponse.json(
    { ...base, ok, db, storage, image },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

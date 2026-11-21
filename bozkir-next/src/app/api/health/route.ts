import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb, hasDb } from '@/lib/db/client';
import { ensureBucket, storageConfigured } from '@/lib/storage/s3';
import { timingSafeEqual } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startedAt = Date.now();

// Deep prob pahalıdır (DB + bucket + sharp) ve healthcheck 15 sn'de bir çağrılır.
// Public uçta kaynak tüketimini önlemek için sonuç kısa süre cache'lenir.
const DEEP_TTL_MS = 30_000;
let deepCache: { at: number; status: number; body: Record<string, unknown> } | null = null;

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
  const endpointSet = !!(process.env.S3_ENDPOINT ?? '').trim();
  if (!storageConfigured()) return endpointSet ? 'down' : 'unconfigured';
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

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function isAuthorizedDeep(request: Request, url: URL): boolean {
  const expected = process.env.HEALTHCHECK_TOKEN?.trim();
  if (expected) {
    const auth = request.headers.get('authorization') ?? '';
    const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    const headerToken = request.headers.get('x-healthcheck-token')?.trim() ?? '';
    const queryToken = url.searchParams.get('token')?.trim() ?? '';
    return [bearer, headerToken, queryToken].some((t) => t && safeEqual(t, expected));
  }

  // Token tanımlı değilse deep kontrolünü yalnızca iç/proxysiz isteklere aç.
  // nginx /api isteklerine X-Real-IP ve X-Forwarded-For eklediği için
  // public trafik (proxy üzerinden) bu kontrolleri geçemez; container içi
  // healthcheck (127.0.0.1, forwardsuz) çalışmaya devam eder.
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return !forwarded && !realIp;
}

/**
 * Sağlık ucu.
 * - Varsayılan (hafif): süreç ayakta mı — uptime izleme/healthcheck için.
 * - `?deep=1`: DB, nesne depolama ve sharp'ı da gerçekten yoklar; biri düşükse 503.
 *   Deep mod, yanlış yapılandırma/bilgi sızıntısını azaltmak için kısıtlıdır:
 *   `HEALTHCHECK_TOKEN` tanımlıysa token ister; aksi halde yalnızca iç/proxysiz
 *   isteklerde (örn. container içi Docker healthcheck) ayrıntı döndürür.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === '1';

  const base = {
    ok: true,
    ts: Date.now(),
    uptime: Math.round((Date.now() - startedAt) / 1000),
  };

  const headers = { 'Cache-Control': 'no-store' };

  if (!deep) {
    return NextResponse.json(base, { headers });
  }

  if (!isAuthorizedDeep(request, url)) {
    return NextResponse.json(base, { status: 200, headers });
  }

  const now = Date.now();
  if (deepCache && now - deepCache.at < DEEP_TTL_MS) {
    return NextResponse.json(deepCache.body, {
      status: deepCache.status,
      headers,
    });
  }

  const [db, storage, image] = await Promise.all([checkDb(), checkStorage(), checkImage()]);
  const ok = db !== 'down' && storage !== 'down' && image !== 'down';
  const body = { ...base, ok, db, storage, image };
  deepCache = { at: now, status: ok ? 200 : 503, body };

  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers,
  });
}

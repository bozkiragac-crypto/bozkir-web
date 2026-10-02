import { NextResponse } from 'next/server';
import { getSiteSettingsFresh } from '@/lib/data/settings';

export const dynamic = 'force-dynamic';

/**
 * Middleware'in bakım modunu DB'den okuyabilmesi için hafif uç.
 * Middleware Edge'de çalıştığı için DB'ye doğrudan erişemez; bu ucu
 * 60 sn cache ile çağırır. Env `MAINTENANCE_MODE=1` her zaman önceliklidir.
 */
export async function GET() {
  let maintenance = process.env.MAINTENANCE_MODE === '1';
  try {
    const s = await getSiteSettingsFresh();
    maintenance = maintenance || s.maintenance;
  } catch {
    // DB yoksa env değeri geçerli
  }
  return NextResponse.json(
    { maintenance },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}

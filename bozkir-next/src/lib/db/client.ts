import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export const hasDb = () => !!process.env.DATABASE_URL;

/** Postgres bağlantısı (tek havuz, uygulama ömrü boyunca). */
export function getDb(): NodePgDatabase<typeof schema> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!db) {
    pool = new Pool({
      connectionString: url,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 5000),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30000),
    });
    // Havuz hataları süreci düşürmesin; logla ve devam et.
    pool.on('error', (err) => {
      console.error('[db] pool error:', err.message);
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

/** Bekleyen istekleri bekleyip havuzu kapatır (graceful shutdown). */
export async function closeDb(): Promise<void> {
  if (!pool) return;
  const p = pool;
  pool = null;
  db = null;
  try {
    await p.end();
  } catch {
    // yok say
  }
}

export { schema };

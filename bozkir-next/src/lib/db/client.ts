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
      statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 8000),
      query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS ?? 10000),
    });
    // Havuz hataları süreci düşürmesin; logla ve devam et.
    pool.on('error', (err) => {
      console.error('[db] pool error:', err.message);
    });
    db = drizzle(pool, { schema });
    // Graceful shutdown (instrumentation) modül çözümlemesi yapmadan havuza erişebilsin.
    (globalThis as Record<string, unknown>).__bozkirDbPool = pool;
  }
  return db;
}

export { schema };

/**
 * Next.js instrumentation: sunucu başlarken bir kez çalışır.
 * Graceful shutdown için SIGTERM/SIGINT yakalanır; DB havuzu kapatılır.
 *
 * Not: Havuza modül importu ile değil, `client.ts`'in `globalThis`'e kaydettiği
 * referans üzerinden erişilir; böylece edge bundle'a `pg` girmez ve üretimde
 * `@/` yol takma adı çözümleme hatası oluşmaz.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} alındı, kapatılıyor...`);
    try {
      const pool = (globalThis as { __bozkirDbPool?: { end: () => Promise<void> } }).__bozkirDbPool;
      if (pool) await pool.end();
    } catch (err) {
      console.error('[shutdown] db kapatma hatası:', err);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

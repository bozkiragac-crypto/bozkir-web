/**
 * Next.js instrumentation: sunucu başlarken bir kez çalışır.
 * Graceful shutdown için SIGTERM/SIGINT yakalanır; DB havuzu kapatılır.
 *
 * Not: `@/lib/db/client` yalnızca Node runtime'da ve çalışma zamanında yüklenir;
 * edge/middleware bundle'ına `pg` (net/tls) girmemesi için import gizlenir.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} alındı, kapatılıyor...`);
    try {
      // Dinamik, analiz edilemeyen import: webpack `pg`'yi bu bundle'a almaz.
      const mod = (await eval('import("@/lib/db/client")')) as {
        closeDb: () => Promise<void>;
      };
      await mod.closeDb();
    } catch (err) {
      console.error('[shutdown] db kapatma hatası:', err);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

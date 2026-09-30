/**
 * Yapılandırılmış hata kaydı. `SENTRY_DSN` tanımlıysa Sentry'ye (opsiyonel,
 * dinamik import) gönderir; her durumda konsola yapılandırılmış JSON basar.
 * Harici bağımlılık zorunlu değildir.
 */
export async function logError(error: unknown, context?: Record<string, unknown>): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload = {
    level: 'error',
    message: err.message,
    stack: err.stack,
    ...context,
    ts: new Date().toISOString(),
  };

  // Konsol (JSON) — log toplayıcılar tarafından okunur.
  console.error(JSON.stringify(payload));

  // Sentry opsiyonel.
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    try {
      // @ts-expect-error — Sentry kurulu değilse dinamik import başarısız olur.
      const Sentry = await import(/* webpackIgnore: true */ '@sentry/nextjs');
      Sentry.captureException(err, { extra: context });
    } catch {
      // Sentry yok/erişilemez — konsol kaydı yeterli.
    }
  }
}

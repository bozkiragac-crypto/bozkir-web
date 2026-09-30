/**
 * Sunucu tarafı analytics kancası. Şimdilik geliştirmede loglar;
 * ileride GA4 Measurement Protocol / başka bir servis buraya bağlanır.
 */
export async function trackServer(event: string, params: Record<string, unknown> = {}): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics:server]', event, params);
  }
}

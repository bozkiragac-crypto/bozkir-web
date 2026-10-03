/**
 * Uygulama genelinde tarih/saat biçimlendirme.
 *
 * Sunucu bileşenleri (RSC) Node içinde çalışır ve konteyner UTC'dir. `timeZone`
 * verilmeden `Intl.DateTimeFormat` çalıştırıldığında saatler 3 saat geri gösterilir.
 * Bu yüzden saat dilimi **her zaman açıkça** verilir.
 */

export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Europe/Istanbul';

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `2.10.2026 13:07` */
export function formatDateTime(value: DateInput, dateStyle: 'short' | 'medium' | 'long' = 'short'): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle, timeStyle: 'short', timeZone: APP_TIME_ZONE }).format(date);
}

/** `2.10.2026` */
export function formatDate(value: DateInput, dateStyle: 'short' | 'medium' | 'long' = 'short'): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle, timeZone: APP_TIME_ZONE }).format(date);
}

/** Yalnızca saat: `13:07` */
export function formatTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('tr-TR', { timeStyle: 'short', timeZone: APP_TIME_ZONE }).format(date);
}

/** `1 dk önce`, `3 sa önce`, `2 gün önce` — aktivite listeleri için. */
export function formatRelative(value: DateInput, now: DateInput = new Date()): string {
  const date = toDate(value);
  const ref = toDate(now);
  if (!date || !ref) return '—';

  const diff = ref.getTime() - date.getTime();
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return 'az önce';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;

  return formatDate(date);
}

/**
 * Gün anahtarı: `2026-10-02`.
 *
 * Sunucuda `toISOString()` UTC gün verdiği için yerel güne göre kayabilir;
 * bu yüzden saat dilimi açıkça belirtilir. PostgreSQL `to_char` gruplamasıyla
 * da aynı sonucu vermesi gerekir (`AT TIME ZONE`).
 */
export function formatDayKey(value: DateInput): string {
  const date = toDate(value);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: APP_TIME_ZONE,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Günün başlangıcı (uygulama saat diliminde) — SQL `>=` karşılaştırmaları için. */
export function startOfLocalDay(value: DateInput = new Date()): Date {
  const date = toDate(value) ?? new Date();
  const key = formatDayKey(date);
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return date;
  // Gün başlangıcını zaman diliminin offset'ine göre geri çevir.
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const offsetMs = localOffsetMs(new Date(guess));
  return new Date(guess - offsetMs);
}

/** Verilen tarih dilimine göre UTC farkı (ms): yerel saat - UTC. */
function localOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  // İstanbul için +3 saat → asUtc (yerel duvar saati) - date (UTC) = +3h.
  return asUtc - date.getTime();
}
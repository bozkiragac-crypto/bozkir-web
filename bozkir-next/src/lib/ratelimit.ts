/**
 * Basit, bellek-temizlenen IP hız sınırlayıcı (tek süreç içi).
 * Çok-instance/dağıtık ortamda nginx `limit_req` birincil katmandır; bu yalnızca
 * uygulama içi ek korumadır (ör. proxy'siz doğrudan erişim).
 *
 * - Pencere dışına çıkan kayıtlar periyodik olarak temizlenir (bellek sızıntısı yok).
 * - Kayıt sayısı üst sınırı vardır (LRU benzeri tahliye).
 */
interface Entry {
  hits: number[];
}

const WINDOW_MS = Number(process.env.RATE_WINDOW_MS ?? 10 * 60 * 1000);
const MAX_HITS = Number(process.env.RATE_MAX_HITS ?? 5);
const MAX_KEYS = Number(process.env.RATE_MAX_KEYS ?? 5000);

const store = new Map<string, Entry>();
let lastPrune = Date.now();

function prune(now: number): void {
  // Pencere dışı kayıtları at.
  for (const [key, entry] of store) {
    entry.hits = entry.hits.filter((t) => now - t < WINDOW_MS);
    if (entry.hits.length === 0) store.delete(key);
  }
  // Üst sınır aşılırsa en eski kayıtları tahliye et.
  if (store.size > MAX_KEYS) {
    const excess = store.size - MAX_KEYS;
    let i = 0;
    for (const key of store.keys()) {
      store.delete(key);
      if (++i >= excess) break;
    }
  }
  lastPrune = now;
}

/** Limit aşıldıysa `true`. `max<=0` ise devre dışı. */
export function isRateLimited(key: string, max = MAX_HITS): boolean {
  if (max <= 0) return false;
  const now = Date.now();
  if (now - lastPrune > 60_000) prune(now);

  const entry = store.get(key) ?? { hits: [] };
  entry.hits = entry.hits.filter((t) => now - t < WINDOW_MS);
  if (entry.hits.length >= max) {
    store.set(key, entry);
    return true;
  }
  entry.hits.push(now);
  store.set(key, entry);
  return false;
}

/** İstemci IP'sini güvenilir proxy ayarına göre çözer. */
export function clientIp(request: Request): string {
  const trusted = process.env.TRUSTED_PROXY !== '0';
  const xff = request.headers.get('x-forwarded-for');
  if (trusted && xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

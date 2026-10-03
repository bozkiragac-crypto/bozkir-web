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

/**
 * İstemci IP'sini güvenilir proxy ayarına göre çözer.
 *
 * Güvenlik notu: `X-Forwarded-For` istemci tarafından gönderilebilir. Bu yüzden
 * soldan SAĞA değil, sağdan sola (bize en yakın güvenilir at) doğru okunur ve
 * değer geçerli bir IP değilse atlanır. nginx `X-Forwarded-For`'u
 * `$remote_addr` ile üzerine yazdığı için production'da tek değer gelir.
 */
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;

function isValidIp(value: string): boolean {
  if (IPV4_RE.test(value)) {
    return value.split('.').every((p) => Number(p) <= 255);
  }
  // IPv6: en az bir ':' içermeli ve yalnızca hex/kolon karakterleri olmalı.
  return value.includes(':') && value.length <= 45 && IPV6_RE.test(value);
}

/** Saf çözümleyici; testler doğrudan çağırabilir. */
export function pickClientIp(headers: Headers, trustedProxy = process.env.TRUSTED_PROXY !== '0'): string {
  if (trustedProxy) {
    const real = headers.get('x-real-ip')?.trim();
    if (real && isValidIp(real)) return real;

    const xff = headers.get('x-forwarded-for');
    if (xff) {
      const parts = xff
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      // Sağdan sola: en yakın proxy'nin eklediği gerçek IP.
      for (let i = parts.length - 1; i >= 0; i--) {
        if (isValidIp(parts[i]!)) return parts[i]!;
      }
    }
  }
  return 'unknown';
}

/** İstemci IP'sini güvenilir proxy ayarına göre çözer. */
export function clientIp(request: Request): string {
  return pickClientIp(request.headers);
}

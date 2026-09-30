const RAW_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
const BASE_URL = RAW_BASE.replace(/\/$/, '');

export class ApiUnavailableError extends Error {
  constructor() {
    super('API yapılandırılmadı (NEXT_PUBLIC_API_URL boş).');
    this.name = 'ApiUnavailableError';
  }
}

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `API isteği başarısız: ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

/** Backend hazır mı? (fallback veriye düşmek için) */
export function hasRemoteApi() {
  return BASE_URL.length > 0;
}

/**
 * Tek merkezi HTTP istemcisi. Bileşenler doğrudan fetch çağırmaz;
 * servis katmanı (lib/api/products vb.) bu fonksiyonu kullanır.
 */
export async function apiGet<T>(path: string, init?: RequestInit & { revalidate?: number }): Promise<T> {
  if (!BASE_URL) throw new ApiUnavailableError();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    next: init?.revalidate !== undefined ? { revalidate: init.revalidate } : undefined,
    ...init,
  });

  if (!res.ok) throw new ApiRequestError(res.status, await res.text().catch(() => undefined));
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (!BASE_URL) throw new ApiUnavailableError();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new ApiRequestError(res.status, await res.text().catch(() => undefined));
  return (await res.json()) as T;
}

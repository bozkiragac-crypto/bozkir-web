import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const ENDPOINT = process.env.S3_ENDPOINT ?? '';
const ACCESS_KEY = process.env.S3_ACCESS_KEY ?? '';
const SECRET_KEY = process.env.S3_SECRET_KEY ?? '';
export const MEDIA_BUCKET = process.env.S3_BUCKET ?? 'bozkir-media';

/**
 * Tarayıcının göreceği public medya tabanı. Üretimde nginx `/media` kökü
 * (`/media`), yerelde doğrudan depolama (`http://localhost:8333/bozkir-media`).
 */
const PUBLIC_BASE = (process.env.S3_PUBLIC_BASE_URL ?? '/media').replace(/\/$/, '');

const WEAK_STORAGE_CREDS = new Set([
  'any',
  'minioadmin',
  'admin',
  'password',
  'secret',
  'changeme',
  'change-me',
  'test',
]);

function isLikelyLocalStorageEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return ['localhost', '127.0.0.1', '::1', 'storage', 'minio', 'seaweedfs'].includes(u.hostname);
  } catch {
    return false;
  }
}

function hasStrongStorageCredentials(): boolean {
  const key = ACCESS_KEY.trim();
  const secret = SECRET_KEY.trim();
  if (!key || !secret) return false;
  const lk = key.toLowerCase();
  const ls = secret.toLowerCase();
  if (WEAK_STORAGE_CREDS.has(lk) || WEAK_STORAGE_CREDS.has(ls)) return false;
  return true;
}

export function storageConfigured(): boolean {
  if (!ENDPOINT.trim()) return false;
  if (process.env.NODE_ENV === 'production' && !isLikelyLocalStorageEndpoint(ENDPOINT)) {
    return hasStrongStorageCredentials();
  }
  return true;
}

function assertStorageUsable(): void {
  if (!ENDPOINT.trim()) {
    throw new Error('Nesne depolama ucu (S3_ENDPOINT) tanımlı değil.');
  }
  if (process.env.NODE_ENV === 'production' && !isLikelyLocalStorageEndpoint(ENDPOINT)) {
    if (!hasStrongStorageCredentials()) {
      throw new Error(
        'Production ortamında nesne depolama kimlik bilgileri güçlü ve benzersiz olmalıdır.',
      );
    }
  }
}

let client: S3Client | null = null;
function getClient(): S3Client {
  assertStorageUsable();
  if (!client) {
    client = new S3Client({
      endpoint: ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: ACCESS_KEY.trim() || 'any',
        secretAccessKey: SECRET_KEY.trim() || 'any',
      },
    });
  }
  return client;
}

let bucketReady = false;

export async function ensureBucket(): Promise<void> {
  // Bucket bir kez doğrulandıktan sonra her healthcheck'te yeniden oluşturmayı deneme.
  if (bucketReady) return;
  try {
    await getClient().send(new CreateBucketCommand({ Bucket: MEDIA_BUCKET }));
    bucketReady = true;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? '';
    if (name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists') {
      bucketReady = true;
      return;
    }
    throw err;
  }
}

function isSafeObjectKey(key: string): boolean {
  if (!key || key.length > 1024) return false;
  // kontrol karakterleri ve null byte
  if (/[\x00-\x1f\x7f]/.test(key)) return false;
  // ters eğik çizgi, baştaki eğik çizgi
  if (key.includes('\\') || key.startsWith('/')) return false;
  // path traversal segmentleri
  const segments = key.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return false;
  return true;
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }));
  } catch (err) {
    // Silme başarısızsa nesne yetim kalır; sessizce yutma, logla.
    console.error(`[storage:s3] deleteObject başarısız (yetim nesne): ${key}`, err);
  }
}

export async function getObject(
  key: string,
  timeoutMs = Number(process.env.S3_REQUEST_TIMEOUT_MS ?? 8000),
): Promise<{ bytes: Uint8Array; contentType: string }> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('S3 getObject zaman aşımı')), timeoutMs);
  });
  try {
    const res = await Promise.race([
      getClient().send(new GetObjectCommand({ Bucket: MEDIA_BUCKET, Key: key })),
      timeout,
    ]);
    const body = res.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
    const bytes = body?.transformToByteArray ? await body.transformToByteArray() : new Uint8Array();
    return { bytes, contentType: res.ContentType ?? 'application/octet-stream' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface MediaObject {
  key: string;
  size: number;
  lastModified: string;
}

/** Bir önek altındaki nesneleri listeler (en çok `limit`). */
export async function listObjects(prefix: string, limit = 500): Promise<MediaObject[]> {
  const out: MediaObject[] = [];
  let token: string | undefined;
  do {
    const res = await getClient().send(
      new ListObjectsV2Command({
        Bucket: MEDIA_BUCKET,
        Prefix: prefix,
        MaxKeys: 200,
        ContinuationToken: token,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith('/')) continue;
      out.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : '',
      });
      if (out.length >= limit) return out;
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

/** Nesne anahtarını tarayıcıda kullanılacak public URL'e çevirir. */
export function publicUrl(key: string): string {
  const value = (key ?? '').trim();
  if (!value) return '';
  // Zaten tam URL, protokol-relative, kök-göreli ya da veri URI ise dokunma.
  if (/^(https?:|data:|\/)/i.test(value)) return value;
  return `${PUBLIC_BASE}/${value}`;
}

/** Verilen mutlak URL kendi depolama alan adımıza mı ait? (open-redirect/SSRF guard) */
export function isOwnStorageUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const hosts = new Set<string>();
  try {
    if (PUBLIC_BASE.startsWith('http')) hosts.add(new URL(PUBLIC_BASE).host);
  } catch {
    // göreli PUBLIC_BASE — atla
  }
  if (ENDPOINT) {
    try {
      hosts.add(new URL(ENDPOINT).host);
    } catch {
      // geçersiz endpoint — atla
    }
  }
  return hosts.has(u.host);
}

/**
 * Public URL'den nesne anahtarını çıkarır. Bizim depomuza ait değilse `null`
 * döner (harici URL'ler ve data: URI'ler korunur).
 */
export function objectKeyFromUrl(url: string): string | null {
  const value = (url ?? '').trim();
  if (!value || value.startsWith('data:')) return null;

  let candidate: string | null = null;

  if (PUBLIC_BASE && value.startsWith(`${PUBLIC_BASE}/`)) {
    candidate = value.slice(PUBLIC_BASE.length + 1);
  } else if (value.startsWith('/media/')) {
    candidate = value.slice('/media/'.length);
  } else {
    const bucketPrefix = `/${MEDIA_BUCKET}/`;
    const idx = value.indexOf(bucketPrefix);
    if (idx !== -1 && idx < value.length - bucketPrefix.length) {
      candidate = value.slice(idx + bucketPrefix.length);
    } else {
      try {
        const u = new URL(value);
        const parts = u.pathname.split('/').filter(Boolean);
        const bi = parts.indexOf(MEDIA_BUCKET);
        if (bi >= 0 && bi < parts.length - 1) candidate = parts.slice(bi + 1).join('/');
      } catch {
        // göreli yol — aşağıda null
      }
    }
  }

  if (!candidate) return null;
  const clean = candidate.split('?')[0]?.split('#')[0] ?? '';
  return isSafeObjectKey(clean) ? clean : null;
}

/** Değeri (URL veya düz anahtar) nesne anahtarına indirger; harici değilse `null`. */
export function toObjectKey(value: string): string | null {
  const v = (value ?? '').trim();
  if (!v || v.startsWith('data:')) return null;
  const fromUrl = objectKeyFromUrl(v);
  if (fromUrl) return fromUrl;
  // Protokolsüz, kök-göreli olmayan düz anahtar (örn. products/<id>/1.webp)
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v) && !v.startsWith('/')) {
    const clean = v.split('?')[0]?.split('#')[0] ?? '';
    return isSafeObjectKey(clean) ? clean : null;
  }
  return null;
}

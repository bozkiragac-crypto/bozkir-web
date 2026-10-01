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

export function storageConfigured(): boolean {
  return !!ENDPOINT;
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId: ACCESS_KEY || 'any', secretAccessKey: SECRET_KEY || 'any' },
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

export async function putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
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
  } catch {
    // yok say
  }
}

export async function getObject(key: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const res = await getClient().send(new GetObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }));
  const body = res.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
  const bytes = body?.transformToByteArray ? await body.transformToByteArray() : new Uint8Array();
  return { bytes, contentType: res.ContentType ?? 'application/octet-stream' };
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

/**
 * Public URL'den nesne anahtarını çıkarır. Bizim depomuza ait değilse `null`
 * döner (harici URL'ler ve data: URI'ler korunur).
 */
export function objectKeyFromUrl(url: string): string | null {
  const value = (url ?? '').trim();
  if (!value || value.startsWith('data:')) return null;

  if (PUBLIC_BASE && value.startsWith(`${PUBLIC_BASE}/`)) return value.slice(PUBLIC_BASE.length + 1);
  if (value.startsWith('/media/')) return value.slice('/media/'.length);

  const bucketPrefix = `/${MEDIA_BUCKET}/`;
  const idx = value.indexOf(bucketPrefix);
  if (idx !== -1 && idx < value.length - bucketPrefix.length) return value.slice(idx + bucketPrefix.length);

  try {
    const u = new URL(value);
    const parts = u.pathname.split('/').filter(Boolean);
    const bi = parts.indexOf(MEDIA_BUCKET);
    if (bi >= 0 && bi < parts.length - 1) return parts.slice(bi + 1).join('/');
  } catch {
    // göreli yol — aşağıda null
  }
  return null;
}

/** Değeri (URL veya düz anahtar) nesne anahtarına indirger; harici değilse `null`. */
export function toObjectKey(value: string): string | null {
  const v = (value ?? '').trim();
  if (!v || v.startsWith('data:')) return null;
  const fromUrl = objectKeyFromUrl(v);
  if (fromUrl) return fromUrl;
  // Protokolsüz, kök-göreli olmayan düz anahtar (örn. products/<id>/1.webp)
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v) && !v.startsWith('/')) return v;
  return null;
}

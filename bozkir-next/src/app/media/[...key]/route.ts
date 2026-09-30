import { getObject, storageConfigured } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Medya akış ucu. S3_PUBLIC_BASE_URL `/media` olduğunda görseller bu route
 * üzerinden servis edilir (üretimde nginx `/media/`'yı doğrudan karşılar,
 * bu uç yalnızca yerel geliştirme/doğrudan erişimde devreye girer).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!storageConfigured()) return new Response('depolama yapılandırılmadı', { status: 503 });

  const { key } = await params;
  const path = (key ?? []).join('/').trim();
  if (!path || path.includes('..')) return new Response('geçersiz anahtar', { status: 400 });
  // Private teklif ekleri public medya rotasından servis edilmez.
  if (path.startsWith('quotes/')) return new Response('bulunamadı', { status: 404 });

  try {
    const { bytes, contentType } = await getObject(path);
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('bulunamadı', { status: 404 });
  }
}

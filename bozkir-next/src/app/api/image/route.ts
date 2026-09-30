import { NextResponse } from 'next/server';
import { fetchProductImageRaw, parseImageList } from '@/lib/data/catalog';
import { publicUrl } from '@/lib/storage/s3';

export const runtime = 'nodejs';

/**
 * Ürün görseli servisi. `img` alanı; Storage URL'i, dosya yolu veya base64
 * olabilir. Storage'a geçiş sonrası ağırlıklı olarak 302 yönlendirme yapar.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const id = sp.get('id') ?? '';
  const index = Math.max(0, Number.parseInt(sp.get('i') ?? '0', 10) || 0);

  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return new Response('geçersiz id', { status: 400 });
  }

  const raw = await fetchProductImageRaw(id);
  const list = parseImageList(raw);
  const value = list[index] ?? '';

  if (!value) return new Response('görsel yok', { status: 404 });

  const resolved = publicUrl(value);
  if (resolved.startsWith('http')) {
    return NextResponse.redirect(resolved, 302);
  }
  if (resolved.startsWith('/')) {
    return NextResponse.redirect(new URL(resolved, request.url), 302);
  }

  if (value.startsWith('data:')) {
    const comma = value.indexOf(',');
    const meta = value.slice(5, comma);
    const payload = value.slice(comma + 1);
    const buffer = meta.includes('base64')
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'binary');

    const mime = meta.includes('png')
      ? 'image/png'
      : meta.includes('jpeg') || meta.includes('jpg')
        ? 'image/jpeg'
        : 'image/webp';

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // Dosya yolu (img/...): Next public'te olmadığı için bulunamadı döner.
  return new Response('görsel bulunamadı', { status: 404 });
}

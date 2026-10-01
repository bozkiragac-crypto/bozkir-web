import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';
import { putObject, storageConfigured } from '@/lib/storage/s3';
import { clientIp, isRateLimited } from '@/lib/ratelimit';
import { isAllowedAttachment } from '@/lib/file-signature';
import { sendWebhook } from '@/lib/webhooks';

export const runtime = 'nodejs';

const MAX_FILE_MB = 10;
const ALLOWED_EXT = /\.(pdf|jpe?g|png|dwg)$/i;

const schema = z.object({
  fullName: z.string().min(2).max(120),
  company: z.string().max(160).optional().default(''),
  phone: z.string().min(10).max(30),
  email: z.string().email().max(160),
  product: z.string().max(160).optional().default(''),
  productId: z.string().max(80).optional().default(''),
  productSlug: z.string().max(160).optional().default(''),
  quantity: z.string().max(60).optional().default(''),
  dimensions: z.string().max(120).optional().default(''),
  note: z.string().max(2000).optional().default(''),
  consent: z.literal('true', { message: 'KVKK onayı gerekli.' }),
  website: z.string().max(0).optional().default(''), // honeypot
});

const RATE_MAX = Number(process.env.QUOTE_RATE_LIMIT_MAX ?? 5);

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(`teklif:${ip}`, RATE_MAX)) {
    return NextResponse.json(
      { ok: false, message: 'Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.' },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: 'Geçersiz form verisi.' }, { status: 400 });
  }

  const parsed = schema.safeParse({
    fullName: String(form.get('fullName') ?? '').trim(),
    company: String(form.get('company') ?? '').trim(),
    phone: String(form.get('phone') ?? '').trim(),
    email: String(form.get('email') ?? '').trim(),
    product: String(form.get('product') ?? '').trim(),
    productId: String(form.get('productId') ?? '').trim(),
    productSlug: String(form.get('productSlug') ?? '').trim(),
    quantity: String(form.get('quantity') ?? '').trim(),
    dimensions: String(form.get('dimensions') ?? '').trim(),
    note: String(form.get('note') ?? '').trim(),
    consent: String(form.get('consent') ?? '').trim(),
    website: String(form.get('website') ?? '').trim(),
  });

  if (!parsed.success) {
    const consentIssue = parsed.error.issues.some((i) => i.path[0] === 'consent');
    return NextResponse.json(
      { ok: false, message: consentIssue ? 'Devam etmek için KVKK onayı gereklidir.' : 'Lütfen alanları kontrol edin.' },
      { status: 422 },
    );
  }
  if (parsed.data.website) {
    // Bot: sessizce başarılı gibi davran.
    return NextResponse.json({ ok: true, message: 'Talebiniz alındı.' });
  }

  const file = form.get('attachment');
  const hasFile = file instanceof File && file.size > 0;

  let fileBuffer: Buffer | null = null;
  if (hasFile) {
    const f = file as File;
    if (f.size > MAX_FILE_MB * 1024 * 1024 || !ALLOWED_EXT.test(f.name)) {
      return NextResponse.json(
        { ok: false, message: `Dosya en fazla ${MAX_FILE_MB} MB ve PDF/JPG/PNG/DWG olmalıdır.` },
        { status: 422 },
      );
    }
    fileBuffer = Buffer.from(await f.arrayBuffer());
    // Uzantıya değil, dosya imzasına (magic bytes) göre doğrula.
    if (!isAllowedAttachment(fileBuffer.subarray(0, 16))) {
      return NextResponse.json(
        { ok: false, message: 'Dosya içeriği geçersiz. Yalnızca PDF/JPG/PNG/DWG yükleyebilirsiniz.' },
        { status: 422 },
      );
    }
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, message: 'Teklif servisi geçici olarak kullanılamıyor. Lütfen telefon veya WhatsApp ile ulaşın.' },
      { status: 503 },
    );
  }

  const d = parsed.data;

  // Eki depoya yükle (varsa). Yükleme başarısız olsa da talep kaydedilir.
  let attachmentName: string | null = null;
  let attachmentKey: string | null = null;
  if (hasFile && fileBuffer) {
    const f = file as File;
    const safeName = f.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const key = `quotes/${crypto.randomUUID()}/${safeName}`;
    try {
      if (storageConfigured()) {
        await putObject(key, fileBuffer, f.type || 'application/octet-stream');
        attachmentKey = key;
      }
      attachmentName = f.name;
    } catch {
      // Yükleme başarısız: yalnızca dosya adını sakla, talebi engelleme.
      attachmentName = f.name;
    }
  }

  try {
    await db.insert(quoteRequests).values({
      fullName: d.fullName,
      company: d.company || null,
      phone: d.phone,
      email: d.email,
      product: d.product || null,
      productId: d.productId || null,
      productSlug: d.productSlug || null,
      quantity: d.quantity || null,
      dimensions: d.dimensions || null,
      note: d.note || null,
      attachmentName,
      attachmentKey,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Gönderilemedi. Lütfen tekrar deneyin veya bizi arayın.' },
      { status: 500 },
    );
  }

  // Webhook (tanımlıysa) — talebi engellemez.
  void sendWebhook('quote.created', {
    fullName: d.fullName,
    company: d.company || '',
    phone: d.phone,
    email: d.email,
    product: d.product || '',
    productSlug: d.productSlug || '',
    quantity: d.quantity || '',
    dimensions: d.dimensions || '',
    note: d.note || '',
    hasAttachment: !!attachmentKey,
  });

  return NextResponse.json({ ok: true, message: 'Talebiniz alındı. En kısa sürede dönüş yapacağız.' });
}

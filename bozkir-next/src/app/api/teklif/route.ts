import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';
import { putObject, storageConfigured } from '@/lib/storage/s3';
import { clientIp, isRateLimited } from '@/lib/ratelimit';
import { isAllowedAttachment } from '@/lib/file-signature';
import { sendWebhook } from '@/lib/webhooks';
import { sendQuoteNotification, sendAdminAlert } from '@/lib/mailer';
import { checkQuoteGuard, attachmentQuotaReached } from '@/lib/quote-guard';
import { verifyTurnstile } from '@/lib/turnstile';

export const runtime = 'nodejs';

const MAX_FILE_MB = 10;
const ALLOWED_EXT = /\.(pdf|jpe?g|png|dwg)$/i;

const CONTROL = /[\r\n\u0000-\u001f\u007f]/;
const singleLine = (max: number) =>
  z
    .string()
    .max(max)
    .refine((v) => !CONTROL.test(v), { message: 'Geçersiz karakter.' });

const schema = z.object({
  fullName: singleLine(120).pipe(z.string().min(2)),
  company: singleLine(160).optional().default(''),
  phone: z
    .string()
    .min(10)
    .max(30)
    .regex(/^[0-9+()\s.\-]+$/, { message: 'Geçersiz telefon.' }),
  email: z.string().email().max(160),
  product: singleLine(160).optional().default(''),
  productId: singleLine(80).optional().default(''),
  productSlug: singleLine(160).optional().default(''),
  quantity: singleLine(60).optional().default(''),
  dimensions: singleLine(120).optional().default(''),
  // Not çok satırlı olabilir; yalnızca zararlı kontrol karakterleri atılır.
  note: z
    .string()
    .max(2000)
    .optional()
    .default('')
    .transform((v) => v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, '')),
  consent: z.literal('true', { message: 'KVKK onayı gerekli.' }),
  turnstileToken: z.string().max(4096).optional().default(''),
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
    turnstileToken: String(form.get('turnstileToken') ?? '').trim(),
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

  // Cloudflare Turnstile (anahtar tanımlıysa zorunlu).
  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json(
      { ok: false, message: 'Bot doğrulaması başarısız. Lütfen sayfayı yenileyip tekrar deneyin.' },
      { status: 422 },
    );
  }

  const d = parsed.data;

  // Kişi/global limitler ve tekrar gönderim kontrolü (DB destekli, XFF'ten bağımsız).
  const guard = await checkQuoteGuard({ email: d.email, phone: d.phone, note: d.note });
  if (guard.action === 'duplicate') {
    // Aynı talep kısa süre içinde tekrar geldi: insert yok, sessiz başarı.
    return NextResponse.json({ ok: true, message: 'Talebiniz alındı. En kısa sürede dönüş yapacağız.' });
  }
  if (guard.action === 'limit') {
    if (guard.reason !== 'contact') {
      // Global devre kesici: yöneticiye uyarı gönder (fire-and-forget).
      void sendWebhook('quote.limit_exceeded', { reason: guard.reason, count: guard.count, ip });
      void sendAdminAlert(
        'Teklif limiti aşıldı',
        `Teklif formu global limiti aşıldı.\n\nSebep: ${guard.reason}\nSayaç: ${guard.count}\nIP: ${ip}\nZaman: ${new Date().toISOString()}`,
      );
    }
    return NextResponse.json(
      {
        ok: false,
        message:
          guard.reason === 'contact'
            ? 'Bu bilgilerle kısa süre içinde çok fazla talep gönderildi. Lütfen biraz sonra tekrar deneyin veya bizi arayın.'
            : 'Teklif sistemi şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin veya telefon/WhatsApp ile ulaşın.',
      },
      { status: 429 },
    );
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

  // Günlük ek kotası dolduysa dosya depoya yazılmaz; talep yine kaydedilir.
  const attachQuotaFull = hasFile ? await attachmentQuotaReached() : false;

  // Eki depoya yükle (varsa). Yükleme başarısız olsa da talep kaydedilir.
  let attachmentName: string | null = null;
  let attachmentKey: string | null = null;
  if (hasFile && fileBuffer) {
    const f = file as File;
    const safeName = f.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const key = `quotes/${crypto.randomUUID()}/${safeName}`;
    try {
      if (storageConfigured() && !attachQuotaFull) {
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

  // E-posta bildirimi (SMTP tanımlıysa) — talebi engellemez.
  void sendQuoteNotification({
    fullName: d.fullName,
    company: d.company || '',
    phone: d.phone,
    email: d.email,
    product: d.product || '',
    quantity: d.quantity || '',
    dimensions: d.dimensions || '',
    note: d.note || '',
    hasAttachment: !!attachmentKey,
  });

  return NextResponse.json({ ok: true, message: 'Talebiniz alındı. En kısa sürede dönüş yapacağız.' });
}

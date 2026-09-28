import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const MAX_FILE_MB = 10;
const ALLOWED_EXT = /\.(pdf|jpe?g|png|dwg)$/i;

const schema = z.object({
  fullName: z.string().min(2).max(120),
  company: z.string().max(160).optional().default(''),
  phone: z.string().min(10).max(30),
  email: z.string().email().max(160),
  product: z.string().max(160).optional().default(''),
  quantity: z.string().max(60).optional().default(''),
  dimensions: z.string().max(120).optional().default(''),
  note: z.string().max(2000).optional().default(''),
  website: z.string().max(0).optional().default(''), // honeypot
});

const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= 5) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return NextResponse.json(
      { ok: false, message: 'Teklif servisi yapılandırılmadı. Lütfen telefon veya WhatsApp ile ulaşın.' },
      { status: 503 },
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (rateLimited(ip)) {
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
    quantity: String(form.get('quantity') ?? '').trim(),
    dimensions: String(form.get('dimensions') ?? '').trim(),
    note: String(form.get('note') ?? '').trim(),
    website: String(form.get('website') ?? '').trim(),
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Lütfen alanları kontrol edin.' }, { status: 422 });
  }
  if (parsed.data.website) {
    // Bot: sessizce başarılı gibi davran.
    return NextResponse.json({ ok: true, message: 'Talebiniz alındı.' });
  }

  const d = parsed.data;
  const lines = [
    'YENİ TEKLİF TALEBİ',
    '─'.repeat(20),
    `Ad Soyad: ${d.fullName}`,
    d.company ? `Firma: ${d.company}` : '',
    `Telefon: ${d.phone}`,
    `E-posta: ${d.email}`,
    d.product ? `Ürün: ${d.product}` : '',
    d.quantity ? `Adet: ${d.quantity}` : '',
    d.dimensions ? `Ölçü: ${d.dimensions}` : '',
    d.note ? `Not: ${d.note}` : '',
    `Tarih: ${new Date().toLocaleString('tr-TR')}`,
  ].filter(Boolean);

  const file = form.get('attachment');
  const hasFile = file instanceof File && file.size > 0;

  if (hasFile) {
    const f = file as File;
    if (f.size > MAX_FILE_MB * 1024 * 1024 || !ALLOWED_EXT.test(f.name)) {
      return NextResponse.json(
        { ok: false, message: `Dosya en fazla ${MAX_FILE_MB} MB ve PDF/JPG/PNG/DWG olmalıdır.` },
        { status: 422 },
      );
    }
  }

  try {
    if (hasFile) {
      const f = file as File;
      const tgForm = new FormData();
      tgForm.set('chat_id', chatId);
      tgForm.set('caption', lines.join('\n').slice(0, 1024));
      tgForm.set('document', new File([await f.arrayBuffer()], f.name, { type: f.type || 'application/octet-stream' }));
      const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: tgForm });
      if (!res.ok) throw new Error('telegram document failed');
    } else {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
      });
      if (!res.ok) throw new Error('telegram message failed');
    }
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Gönderilemedi. Lütfen tekrar deneyin veya bizi arayın.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, message: 'Talebiniz alındı. En kısa sürede dönüş yapacağız.' });
}

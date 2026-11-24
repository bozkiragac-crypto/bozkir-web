import nodemailer from 'nodemailer';
import { getSiteSettings } from '@/lib/data/settings';

export interface QuoteMailData {
  fullName: string;
  company?: string;
  phone: string;
  email: string;
  product?: string;
  quantity?: string;
  dimensions?: string;
  note?: string;
  hasAttachment?: boolean;
}

/** Başlığa giden alanlardan CR/LF ve kontrol karakterlerini temizler. */
export function sanitizeHeader(value: string | undefined): string {
  return (value ?? '').replace(/[\r\n\u0000-\u001f\u007f]+/g, ' ').trim();
}

function env(name: string): string {
  return process.env[name]?.trim() ?? '';
}

/**
 * SMTP yapılandırması env-only: hassas parola DB'de tutulmaz.
 * Desteklenen env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAIL.
 */
function smtpReady(s: { notifyEmail: string; email: string }) {
  const host = env('SMTP_HOST');
  const to = sanitizeHeader(env('NOTIFY_EMAIL') || s.notifyEmail || s.email);
  if (!host || !to) return null;
  const portNum = Number.parseInt(env('SMTP_PORT') || '587', 10) || 587;
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  const from = sanitizeHeader(env('SMTP_FROM')) || sanitizeHeader(user) || to;
  const transporter = nodemailer.createTransport({
    host,
    port: portNum,
    secure: portNum === 465,
    auth: user ? { user, pass } : undefined,
  });
  return { transporter, to, from };
}

/**
 * Yeni teklif bildirimi. SMTP ayarları boşsa veya gönderim başarısız olursa
 * sessizce döner; teklif kaydı hiçbir durumda etkilenmez (webhooks deseni).
 */
export async function sendQuoteNotification(data: QuoteMailData): Promise<void> {
  try {
    const s = await getSiteSettings();
    const ready = smtpReady(s);
    if (!ready) return;

    const name = sanitizeHeader(data.fullName);
    const lines = [
      'Yeni teklif talebi',
      '',
      `Ad Soyad : ${name}`,
      `Firma    : ${sanitizeHeader(data.company) || '-'}`,
      `Telefon  : ${sanitizeHeader(data.phone)}`,
      `E-posta  : ${sanitizeHeader(data.email)}`,
      `Ürün     : ${sanitizeHeader(data.product) || '-'}`,
      `Adet     : ${sanitizeHeader(data.quantity) || '-'}`,
      `Ölçü     : ${sanitizeHeader(data.dimensions) || '-'}`,
      `Ek dosya : ${data.hasAttachment ? 'var' : 'yok'}`,
      '',
      'Not:',
      data.note || '-',
    ];

    await ready.transporter.sendMail({
      from: ready.from,
      to: ready.to,
      replyTo: sanitizeHeader(data.email),
      subject: `Yeni teklif talebi: ${name}`,
      text: lines.join('\n'),
    });
  } catch {
    // SMTP hatası teklif kaydını engellemez.
  }
}

/** Yöneticiye güvenlik/operasyon uyarısı (ör. global teklif limiti aşıldı). */
export async function sendAdminAlert(subject: string, text: string): Promise<void> {
  try {
    const s = await getSiteSettings();
    const ready = smtpReady(s);
    if (!ready) return;
    await ready.transporter.sendMail({
      from: ready.from,
      to: ready.to,
      subject: sanitizeHeader(subject),
      text,
    });
  } catch {
    // Uyarı gönderilemese akış bozulmaz.
  }
}

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

function smtpReady(s: {
  smtp: { host: string; port: string; user: string; pass: string; from: string };
  notifyEmail: string;
  email: string;
}) {
  const to = sanitizeHeader(s.notifyEmail || s.email);
  if (!s.smtp.host || !to) return null;
  const portNum = Number(s.smtp.port) || 587;
  const transporter = nodemailer.createTransport({
    host: s.smtp.host,
    port: portNum,
    secure: portNum === 465,
    auth: s.smtp.user ? { user: s.smtp.user, pass: s.smtp.pass } : undefined,
  });
  const from = sanitizeHeader(s.smtp.from) || sanitizeHeader(s.smtp.user) || to;
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

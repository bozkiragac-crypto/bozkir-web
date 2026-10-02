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

/**
 * Yeni teklif bildirimi. SMTP ayarları boşsa veya gönderim başarısız olursa
 * sessizce döner; teklif kaydı hiçbir durumda etkilenmez (webhooks deseni).
 */
export async function sendQuoteNotification(data: QuoteMailData): Promise<void> {
  try {
    const s = await getSiteSettings();
    const { host, port, user, pass, from } = s.smtp;
    const to = (s.notifyEmail || s.email || '').trim();
    if (!host || !to) return;

    const portNum = Number(port) || 587;
    const transporter = nodemailer.createTransport({
      host,
      port: portNum,
      secure: portNum === 465,
      auth: user ? { user, pass } : undefined,
    });

    const lines = [
      'Yeni teklif talebi',
      '',
      `Ad Soyad : ${data.fullName}`,
      `Firma    : ${data.company || '-'}`,
      `Telefon  : ${data.phone}`,
      `E-posta  : ${data.email}`,
      `Ürün     : ${data.product || '-'}`,
      `Adet     : ${data.quantity || '-'}`,
      `Ölçü     : ${data.dimensions || '-'}`,
      `Ek dosya : ${data.hasAttachment ? 'var' : 'yok'}`,
      '',
      'Not:',
      data.note || '-',
    ];

    await transporter.sendMail({
      from: from || user || to,
      to,
      replyTo: data.email,
      subject: `Yeni teklif talebi: ${data.fullName}`,
      text: lines.join('\n'),
    });
  } catch {
    // SMTP hatası teklif kaydını engellemez.
  }
}

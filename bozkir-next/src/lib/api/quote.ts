import type { QuoteRequest, QuoteResponse } from '@/types/quote';

/**
 * Teklif isteği aynı origin'deki `/api/teklif` sunucu route'una gönderilir.
 * Ürün bağlantısı (ürün sayfasından gelen teklifler) formda taşınır.
 */
export async function submitQuote(payload: QuoteRequest, file?: File | null): Promise<QuoteResponse> {
  const form = new FormData();
  form.set('fullName', payload.fullName);
  form.set('company', payload.company ?? '');
  form.set('phone', payload.phone);
  form.set('email', payload.email);
  form.set('product', payload.product ?? '');
  form.set('productId', payload.productId ?? '');
  form.set('productSlug', payload.productSlug ?? '');
  form.set('quantity', payload.quantity ?? '');
  form.set('dimensions', payload.dimensions ?? '');
  form.set('note', payload.note ?? '');
  form.set('consent', payload.consent ? 'true' : 'false');
  form.set('turnstileToken', payload.turnstileToken ?? '');
  form.set('website', ''); // honeypot
  if (file) form.set('attachment', file);

  try {
    const res = await fetch('/api/teklif', { method: 'POST', body: form });
    const data = (await res.json().catch(() => null)) as QuoteResponse | null;
    if (!data) return { ok: false, message: 'Sunucu yanıtı okunamadı. Lütfen tekrar deneyin.', status: res.status };
    return { ...data, status: res.status };
  } catch {
    return { ok: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin veya bizi arayın.' };
  }
}

/**
 * Teklif durum sözlüğü.
 *
 * `actions.ts` bir `'use server'` dosyası olduğu için oradan sabit/dizi
 * export etmek yasaktır (çalışma zamanı "can only export async functions").
 * Bu yüzden durum listesi ve tip burada tutulur; hem server action hem
 * istemci bileşenleri buradan okur.
 */

export const QUOTE_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  new: 'Yeni',
  contacted: 'İletişime geçildi',
  quoted: 'Fiyat verildi',
  won: 'Kazanıldı',
  lost: 'Kaybedildi',
};

export const QUOTE_STATUS_CLASS: Record<QuoteStatus, string> = {
  new: 'border-sky-300 bg-sky-50 text-sky-700',
  contacted: 'border-amber-300 bg-amber-50 text-amber-700',
  quoted: 'border-violet-300 bg-violet-50 text-violet-700',
  won: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  lost: 'border-red-300 bg-red-50 text-red-700',
};

export function isQuoteStatus(v: string): v is QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(v);
}

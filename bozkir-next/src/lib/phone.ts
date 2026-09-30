/** Telefon numarasından `tel:` bağlantısı üretir. Client-safe (DB bağımlılığı yok). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

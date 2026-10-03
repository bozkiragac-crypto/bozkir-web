import { and, count, eq, gte, isNotNull, or, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { quoteRequests } from '@/lib/db/schema';

/**
 * Teklif formu kötüye kullanım sınırları (env ile ayarlanabilir).
 * Amaç: XFF spoof'undan bağımsız olarak DB'nin spam ile doldurulmasını
 * durdurmak (kişi başı + global devre kesici + tekrar bastırma + ek kotası).
 */
export const QUOTE_LIMITS = {
  /** Aynı e-posta VEYA telefonun saatlik kabul edilen talep sayısı. */
  perContactPerHour: Number(process.env.QUOTE_PER_CONTACT_PER_HOUR ?? 3),
  /** Tüm site genelinde saatlik üst sınır. */
  globalPerHour: Number(process.env.QUOTE_GLOBAL_PER_HOUR ?? 30),
  /** Tüm site genelinde günlük üst sınır. */
  globalPerDay: Number(process.env.QUOTE_GLOBAL_PER_DAY ?? 200),
  /** Aynı kişi + aynı not bu süre içinde tekrar gelirse insert edilmez. */
  dedupeMinutes: Number(process.env.QUOTE_DEDUPE_MINUTES ?? 10),
  /** Günlük depolanacak en fazla ek dosya sayısı (depolama şişmesini önler). */
  attachDailyCount: Number(process.env.QUOTE_ATTACH_DAILY_COUNT ?? 100),
};

export type QuoteGuardResult =
  | { action: 'allow' }
  | { action: 'duplicate' }
  | { action: 'limit'; reason: 'contact' | 'hour' | 'day'; count: number };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Kişi/global limitleri ve tekrar gönderimi DB üzerinden kontrol eder. */
export async function checkQuoteGuard(input: {
  email: string;
  phone: string;
  note: string;
}): Promise<QuoteGuardResult> {
  const db = getDb();
  if (!db) return { action: 'allow' };

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const dedupeAgo = new Date(now - QUOTE_LIMITS.dedupeMinutes * 60 * 1000);

  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  const note = input.note.trim();

  const [contactRow, hourRow, dayRow, dupRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(quoteRequests)
      .where(
        and(
          gte(quoteRequests.createdAt, hourAgo),
          or(
            sql`lower(${quoteRequests.email}) = ${email}`,
            eq(quoteRequests.phone, phone),
          ),
        ),
      ),
    db.select({ value: count() }).from(quoteRequests).where(gte(quoteRequests.createdAt, hourAgo)),
    db.select({ value: count() }).from(quoteRequests).where(gte(quoteRequests.createdAt, dayAgo)),
    db
      .select({ value: count() })
      .from(quoteRequests)
      .where(
        and(
          gte(quoteRequests.createdAt, dedupeAgo),
          sql`lower(${quoteRequests.email}) = ${email}`,
          eq(quoteRequests.phone, phone),
          sql`coalesce(${quoteRequests.note}, '') = ${note}`,
        ),
      ),
  ]);

  const contact = Number(contactRow[0]?.value ?? 0);
  const hour = Number(hourRow[0]?.value ?? 0);
  const day = Number(dayRow[0]?.value ?? 0);
  const dup = Number(dupRow[0]?.value ?? 0);

  // Tekrar gönderim: sessizce başarı dönülür, DB'ye yazılmaz.
  if (dup > 0) return { action: 'duplicate' };

  if (QUOTE_LIMITS.perContactPerHour > 0 && contact >= QUOTE_LIMITS.perContactPerHour) {
    return { action: 'limit', reason: 'contact', count: contact };
  }
  if (QUOTE_LIMITS.globalPerHour > 0 && hour >= QUOTE_LIMITS.globalPerHour) {
    return { action: 'limit', reason: 'hour', count: hour };
  }
  if (QUOTE_LIMITS.globalPerDay > 0 && day >= QUOTE_LIMITS.globalPerDay) {
    return { action: 'limit', reason: 'day', count: day };
  }
  return { action: 'allow' };
}

/** Günlük ek dosya kotası doldu mu? Dolduysa ek depoya yazılmaz. */
export async function attachmentQuotaReached(): Promise<boolean> {
  const db = getDb();
  if (!db || QUOTE_LIMITS.attachDailyCount <= 0) return false;
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ value: count() })
    .from(quoteRequests)
    .where(and(gte(quoteRequests.createdAt, dayAgo), isNotNull(quoteRequests.attachmentKey)));
  return Number(row?.value ?? 0) >= QUOTE_LIMITS.attachDailyCount;
}

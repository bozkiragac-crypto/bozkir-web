'use server';

import { lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { activityLog } from '@/lib/db/schema';
import { logActivity, requireOwner } from '@/lib/admin/guard';

const RETENTION_DAYS = 90;

/** Owner: 90 günden eski aktivite kayıtlarını temizler. */
export async function clearActivityLog(): Promise<{ ok: boolean; error?: string; deleted?: number }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(activityLog)
    .where(lt(activityLog.createdAt, cutoff))
    .returning({ id: activityLog.id });

  await logActivity(admin, 'delete', 'activity', undefined, `${deleted.length} eski aktivite kaydı temizlendi`);
  revalidatePath('/admin/aktivite');
  return { ok: true, deleted: deleted.length };
}

import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { activityLog, adminUsers } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';

export type AdminUser = typeof adminUsers.$inferSelect;

/** Oturumdaki admin kullanıcıyı DB'den doğrular (aktif + mevcut). */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getSession();
  if (!session?.admin) return null;
  const db = getDb();
  if (!db) return null;
  try {
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, session.sub)).limit(1);
    const user = rows[0];
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) throw new Error('Yetkisiz işlem. Lütfen yönetici hesabıyla giriş yapın.');
  return user;
}

export async function requireOwner(): Promise<AdminUser> {
  const user = await requireAdminUser();
  if (user.role !== 'owner') throw new Error('Bu işlem yalnızca sahip hesabına açıktır.');
  return user;
}

/** Aktivite kaydı (hata olsa bile akışı bozmaz). */
export async function logActivity(
  user: Pick<AdminUser, 'id' | 'username'>,
  action: string,
  entity?: string,
  entityId?: string,
  summary?: string,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.insert(activityLog).values({
      userId: user.id,
      username: user.username ?? '—',
      action,
      entity: entity ?? null,
      entityId: entityId ?? null,
      summary: summary ?? null,
    });
  } catch {
    // yok say
  }
}

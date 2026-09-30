import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { adminUsers } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { UsersManager } from '@/components/admin/UsersManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getSession();
  const db = getDb();
  if (!db || !session) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  if (session.role !== 'owner') {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Kullanıcılar</h1>
        <p className="mt-3 rounded-lg border border-border bg-surface p-5 text-sm text-muted-strong">
          Bu bölüm yalnızca sahip hesabına açıktır.
        </p>
      </div>
    );
  }

  const rows = await db.select().from(adminUsers).orderBy(asc(adminUsers.username));

  return (
    <UsersManager
      currentId={session.sub}
      users={rows.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      }))}
    />
  );
}

import { desc, ilike, or } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { activityLog } from '@/lib/db/schema';
import { formatDateTime } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  login: 'Giriş',
  logout: 'Çıkış',
  create: 'Ekleme',
  update: 'Güncelleme',
  delete: 'Silme',
  upload: 'Yükleme',
};

function fmt(d: Date) {
  return formatDateTime(d);
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';

  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const where = q ? or(ilike(activityLog.summary, `%${q}%`), ilike(activityLog.username, `%${q}%`)) : undefined;
  const rows = await db.select().from(activityLog).where(where).orderBy(desc(activityLog.createdAt)).limit(200);

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Aktivite kaydı</h1>
      <p className="mt-1 text-sm text-muted-strong">Son {rows.length} işlem</p>

      <form className="mt-6 flex items-center gap-3 rounded-full border border-border px-4 sm:max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Kullanıcı veya açıklama ara..."
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-surface text-foreground">
            <tr>
              <th className="p-4 font-medium">Tarih</th>
              <th className="p-4 font-medium">Kullanıcı</th>
              <th className="p-4 font-medium">İşlem</th>
              <th className="p-4 font-medium">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="numerals whitespace-nowrap p-4 text-muted-strong">{fmt(a.createdAt)}</td>
                <td className="p-4">{a.username}</td>
                <td className="p-4">
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-strong">
                    {ACTION_LABEL[a.action] ?? a.action}
                  </span>
                </td>
                <td className="p-4 text-muted-strong">{a.summary ?? `${a.entity ?? ''} ${a.entityId ?? ''}`.trim()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted-strong">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

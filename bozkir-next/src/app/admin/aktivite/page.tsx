import { count, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { activityLog } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/datetime';
import {
  ACTION_LABEL,
  RANGE_LABEL,
  activityQueryString,
  activityWhere,
  parseActivityFilters,
} from '@/lib/activity';
import { ClearActivityButton } from '@/components/admin/ClearActivityButton';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

function fmt(d: Date) {
  return formatDateTime(d);
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = parseActivityFilters(sp);
  const page = Math.max(1, parseInt(typeof sp.sayfa === 'string' ? sp.sayfa : '1', 10) || 1);

  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const where = activityWhere(filters);

  const [rows, [totalRow], actionRows, entityRows, session] = await Promise.all([
    db
      .select()
      .from(activityLog)
      .where(where)
      .orderBy(desc(activityLog.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(activityLog).where(where),
    db.selectDistinct({ action: activityLog.action }).from(activityLog),
    db.selectDistinct({ entity: activityLog.entity }).from(activityLog),
    getSession(),
  ]);

  const total = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actions = actionRows.map((r) => r.action).filter(Boolean).sort();
  const entities = entityRows.map((r) => r.entity).filter((e): e is string => Boolean(e)).sort();

  const exportHref = `/api/admin/activity-export${activityQueryString(filters)}`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Aktivite kaydı</h1>
          <p className="mt-1 text-sm text-muted-strong">{total} işlem</p>
        </div>
        <div className="flex items-start gap-3">
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-strong transition-colors hover:border-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" /> CSV indir
          </a>
          {session?.role === 'owner' && <ClearActivityButton />}
        </div>
      </div>

      <form action="/admin/aktivite" method="get" className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-border px-4 sm:max-w-sm">
          <Search className="h-4 w-4 flex-none text-muted" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Kullanıcı veya açıklama ara..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <select
          name="aralik"
          defaultValue={filters.aralik}
          className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
        >
          <option value="">Tüm zamanlar</option>
          {Object.entries(RANGE_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="islem"
          defaultValue={filters.islem}
          className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
        >
          <option value="">Tüm işlemler</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a] ?? a}
            </option>
          ))}
        </select>
        <select
          name="varlik"
          defaultValue={filters.varlik}
          className="h-11 rounded-full border border-border bg-transparent px-4 text-sm outline-none"
        >
          <option value="">Tüm varlıklar</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded-full border border-border px-5 text-sm text-fg transition-colors hover:bg-surface-2"
        >
          Filtrele
        </button>
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

      {totalPages > 1 && (
        <nav aria-label="Aktivite sayfaları" className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/aktivite${activityQueryString(filters, page - 1)}`}
              className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2"
            >
              Önceki
            </Link>
          )}
          <span className="numerals px-2 text-xs text-muted-strong">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/aktivite${activityQueryString(filters, page + 1)}`}
              className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2"
            >
              Sonraki
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

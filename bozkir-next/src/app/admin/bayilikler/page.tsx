import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { brands } from '@/lib/db/schema';
import { DeleteBrandButton } from '@/components/admin/DeleteButtons';

export default async function AdminBrandsPage() {
  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const rows = await db.select().from(brands).orderBy(asc(brands.sortOrder));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Bayilikler / Markalar</h1>
          <p className="mt-1 text-sm text-muted-strong">Bayilikler sayfasında gösterilen markalar.</p>
        </div>
        <Link
          href="/admin/bayilikler/yeni"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Yeni Marka
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-foreground">
            <tr>
              <th className="p-4 font-medium">Logo</th>
              <th className="p-4 font-medium">Ad</th>
              <th className="p-4 font-medium">Kategori</th>
              <th className="p-4 font-medium">Durum</th>
              <th className="p-4 font-medium">Sıra</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="p-4">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt="" className="h-10 w-20 rounded object-contain" />
                  ) : (
                    <span className="text-xs text-muted">yok</span>
                  )}
                </td>
                <td className="p-4">
                  <Link href={`/admin/bayilikler/${b.id}`} className="font-medium hover:underline">
                    {b.name}
                  </Link>
                </td>
                <td className="p-4 text-muted-strong">{b.category ?? '—'}</td>
                <td className="p-4">
                  <span className={b.isActive ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-800' : 'rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-strong'}>
                    {b.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="numerals p-4 text-muted-strong">{b.sortOrder}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/bayilikler/${b.id}`} className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2">
                      Düzenle
                    </Link>
                    <DeleteBrandButton id={b.id} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-strong">
                  Henüz marka yok. &quot;Yeni Marka&quot; ile ekleyin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

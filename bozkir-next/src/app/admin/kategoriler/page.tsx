import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { categories } from '@/lib/db/schema';
import { DeleteCategoryButton } from '@/components/admin/DeleteButtons';

export default async function AdminCategoriesPage() {
  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Kategoriler</h1>
          <p className="mt-1 text-sm text-muted-strong">Koleksiyonlar ve vitrin. Ürünler kategorilere göre gruplanır.</p>
        </div>
        <Link
          href="/admin/kategoriler/yeni"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Yeni Kategori
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-foreground">
            <tr>
              <th className="p-4 font-medium">Görsel</th>
              <th className="p-4 font-medium">Ad</th>
              <th className="p-4 font-medium">Slug</th>
              <th className="p-4 font-medium">Vitrin</th>
              <th className="p-4 font-medium">Durum</th>
              <th className="p-4 font-medium">Sıra</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-4">
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <span className="text-xs text-muted">yok</span>
                  )}
                </td>
                <td className="p-4">
                  <Link href={`/admin/kategoriler/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="p-4 text-muted-strong">{c.slug}</td>
                <td className="p-4">{c.featured ? 'Evet' : '—'}</td>
                <td className="p-4">
                  <span className={c.isActive ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-800' : 'rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-strong'}>
                    {c.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="numerals p-4 text-muted-strong">{c.sortOrder}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/kategoriler/${c.id}`} className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-2">
                      Düzenle
                    </Link>
                    <DeleteCategoryButton id={c.id} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-strong">
                  Henüz kategori yok. &quot;Yeni Kategori&quot; ile ekleyin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { contentBlocks, contentItems } from '@/lib/db/schema';
import { getDictionary } from '@/i18n/dictionaries';
import { AboutEditor } from '@/components/admin/AboutEditor';

export const dynamic = 'force-dynamic';

const KEY = 'about';

export default async function AboutAdminPage() {
  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const [, itemRows] = await Promise.all([
    db.select().from(contentBlocks).where(eq(contentBlocks.key, KEY)).limit(1),
    db.select().from(contentItems).where(eq(contentItems.blockKey, KEY)).orderBy(asc(contentItems.sortOrder)),
  ]);

  const tr = getDictionary('tr').pages.about;
  const en = getDictionary('en').pages.about;
  const ar = getDictionary('ar').pages.about;

  const dbStats = itemRows.filter((i) => (i.tag ?? '').toLowerCase() === 'stat');
  const dbValues = itemRows.filter((i) => (i.tag ?? '').toLowerCase() === 'value');
  const dbTimeline = itemRows.filter((i) => (i.tag ?? '').toLowerCase() === 'timeline');

  const stats = dbStats.length
    ? dbStats.map((i) => ({
        value: i.title ?? '',
        label: i.description ?? '',
        labelEn: i.descriptionEn ?? '',
        labelAr: i.descriptionAr ?? '',
      }))
    : tr.stats.map((s, i) => ({
        value: String(s.value),
        label: s.label,
        labelEn: en.stats[i]?.label ?? '',
        labelAr: ar.stats[i]?.label ?? '',
      }));

  const values = dbValues.length
    ? dbValues.map((i) => ({
        title: i.title ?? '',
        text: i.description ?? '',
        titleEn: i.titleEn ?? '',
        titleAr: i.titleAr ?? '',
        textEn: i.descriptionEn ?? '',
        textAr: i.descriptionAr ?? '',
      }))
    : tr.values.map((v, i) => ({
        title: v.title,
        text: v.text,
        titleEn: en.values[i]?.title ?? '',
        titleAr: ar.values[i]?.title ?? '',
        textEn: en.values[i]?.text ?? '',
        textAr: ar.values[i]?.text ?? '',
      }));

  const timeline = dbTimeline.length
    ? dbTimeline.map((i) => ({
        year: i.title ?? '',
        title: i.description ?? '',
        text: i.linkUrl ?? '',
        titleEn: i.descriptionEn ?? '',
        titleAr: i.descriptionAr ?? '',
        textEn: i.tagEn ?? '',
        textAr: i.tagAr ?? '',
      }))
    : tr.timeline.items.map((m, i) => ({
        year: m.year,
        title: m.title,
        text: m.text,
        titleEn: en.timeline.items[i]?.title ?? '',
        titleAr: ar.timeline.items[i]?.title ?? '',
        textEn: en.timeline.items[i]?.text ?? '',
        textAr: ar.timeline.items[i]?.text ?? '',
      }));

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Hakkımızda İçeriği</h1>
      <p className="mt-1 text-sm text-muted-strong">
        İstatistikler, değerler ve zaman çizelgesi. Boş bırakılan alanlar sitede varsayılan (sözlük) içerikle gösterilir.
      </p>
      {itemRows.length === 0 && (
        <p className="mt-2 text-xs text-muted">
          Şu an varsayılan içerik gösteriliyor. Kaydettiğinizde veritabanına yazılır.
        </p>
      )}

      <div className="mt-8">
        <AboutEditor initialStats={stats} initialValues={values} initialTimeline={timeline} />
      </div>
    </div>
  );
}

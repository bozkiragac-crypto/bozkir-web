import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { contentBlocks, contentItems } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { fallbackContent } from '@/data/content';
import { ContentBlockForm } from '@/components/admin/ContentBlockForm';
import type { EditableItem } from '@/components/admin/ContentItemsEditor';

export const dynamic = 'force-dynamic';

const KEY = 'gallery';

export default async function VitrinAdminPage() {
  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const [blockRows, itemRows] = await Promise.all([
    db.select().from(contentBlocks).where(eq(contentBlocks.key, KEY)).limit(1),
    db.select().from(contentItems).where(eq(contentItems.blockKey, KEY)).orderBy(asc(contentItems.sortOrder)),
  ]);

  const fallback = fallbackContent[KEY];
  const block = blockRows[0];

  const initial = {
    title: block?.title || fallback?.title || '',
    subtitle: block?.subtitle || fallback?.subtitle || '',
    body: block?.body || fallback?.body || '',
    isActive: block?.isActive ?? true,
    titleEn: block?.titleEn ?? '',
    titleAr: block?.titleAr ?? '',
    subtitleEn: block?.subtitleEn ?? '',
    subtitleAr: block?.subtitleAr ?? '',
    bodyEn: block?.bodyEn ?? '',
    bodyAr: block?.bodyAr ?? '',
  };

  const items: EditableItem[] =
    itemRows.length > 0
      ? itemRows.map((i) => ({
          id: i.id,
          title: i.title ?? '',
          description: i.description ?? '',
          imageUrl: publicUrl(i.imageUrl ?? ''),
          linkUrl: i.linkUrl ?? '',
          tag: i.tag ?? '',
          sortOrder: i.sortOrder ?? 0,
          isActive: i.isActive ?? true,
          titleEn: i.titleEn ?? '',
          titleAr: i.titleAr ?? '',
          descriptionEn: i.descriptionEn ?? '',
          descriptionAr: i.descriptionAr ?? '',
          tagEn: i.tagEn ?? '',
          tagAr: i.tagAr ?? '',
        }))
      : (fallback?.items ?? []).map((i) => ({
          id: i.id,
          title: i.title,
          description: i.description,
          imageUrl: i.imageUrl,
          linkUrl: i.linkUrl,
          tag: i.tag,
          sortOrder: i.sortOrder,
          isActive: true,
          titleEn: '',
          titleAr: '',
          descriptionEn: '',
          descriptionAr: '',
          tagEn: '',
          tagAr: '',
        }));

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Malzeme Vitrini</h1>
      <p className="mt-1 text-sm text-muted-strong">
        Anasayfadaki vitrin görsellerini ekleyin, çıkarın, sıralayın ve düzenleyin.
      </p>
      <p className="mt-2 text-xs text-muted">
        {itemRows.length > 0
          ? 'Kayıtlı görseller düzenleniyor.'
          : 'Varsayılan vitrin gösteriliyor — kaydettiğinizde içerik veritabanına yazılır.'}
      </p>

      <div className="mt-8">
        <ContentBlockForm blockKey={KEY} initial={initial} items={items} />
      </div>
    </div>
  );
}

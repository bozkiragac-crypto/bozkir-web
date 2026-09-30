import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { contentBlocks, contentItems } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { fallbackContent } from '@/data/content';
import { ContentBlockForm } from '@/components/admin/ContentBlockForm';
import type { EditableItem } from '@/components/admin/ContentItemsEditor';

export const dynamic = 'force-dynamic';

const VALID_KEYS = ['gallery', 'guide', 'applications', 'process', 'faq'];

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function EditContentBlockPage({ params }: PageProps) {
  const { key } = await params;
  if (!VALID_KEYS.includes(key)) notFound();

  const db = getDb();
  if (!db) notFound();

  const [blockRows, itemRows] = await Promise.all([
    db.select().from(contentBlocks).where(eq(contentBlocks.key, key)).limit(1),
    db.select().from(contentItems).where(eq(contentItems.blockKey, key)).orderBy(asc(contentItems.sortOrder)),
  ]);

  const fallback = fallbackContent[key];
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
      <Link href="/admin/icerik" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> İçerik
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">{initial.title || key}</h1>
      <p className="mt-1 text-sm text-muted">
        {itemRows.length > 0
          ? 'Kayıtlı içerik düzenleniyor.'
          : 'Varsayılan taslak gösteriliyor — kaydettiğinizde içerik veritabanına yazılır.'}
      </p>

      <div className="mt-8">
        <ContentBlockForm blockKey={key} initial={initial} items={items} />
      </div>
    </div>
  );
}

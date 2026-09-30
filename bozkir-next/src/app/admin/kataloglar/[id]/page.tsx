import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { catalogs } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { CatalogForm } from '@/components/admin/CatalogForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCatalogPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  if (!db) notFound();

  const rows = await db.select().from(catalogs).where(eq(catalogs.id, id)).limit(1);
  const catalog = rows[0];
  if (!catalog) notFound();

  return (
    <div>
      <Link href="/admin/kataloglar" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kataloglar
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Kataloğu Düzenle</h1>
      <p className="mt-1 text-sm text-muted">{catalog.title}</p>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <CatalogForm
          initial={{
            id: catalog.id,
            slug: catalog.slug ?? '',
            title: catalog.title ?? '',
            description: catalog.description ?? '',
            year: catalog.year ?? new Date().getFullYear(),
            cover: catalog.cover ? publicUrl(catalog.cover) : '',
            pdfUrl: catalog.pdfUrl ? publicUrl(catalog.pdfUrl) : '',
            pageCount: catalog.pageCount ?? 0,
            sortOrder: catalog.sortOrder ?? 0,
            isActive: catalog.isActive ?? true,
            titleEn: catalog.titleEn ?? '',
            titleAr: catalog.titleAr ?? '',
            descriptionEn: catalog.descriptionEn ?? '',
            descriptionAr: catalog.descriptionAr ?? '',
          }}
        />
      </div>
    </div>
  );
}

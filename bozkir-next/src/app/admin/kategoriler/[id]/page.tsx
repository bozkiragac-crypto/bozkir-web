import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { categories } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { CategoryForm } from '@/components/admin/CategoryForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  if (!db) notFound();

  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  const category = rows[0];
  if (!category) notFound();

  return (
    <div>
      <Link href="/admin/kategoriler" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kategoriler
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Kategoriyi Düzenle</h1>
      <p className="mt-1 text-sm text-muted">{category.name}</p>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <CategoryForm
          initial={{
            id: category.id,
            slug: category.slug,
            name: category.name,
            nameEn: category.nameEn ?? '',
            nameAr: category.nameAr ?? '',
            description: category.description ?? '',
            descriptionEn: category.descriptionEn ?? '',
            descriptionAr: category.descriptionAr ?? '',
            shortDescription: category.shortDescription ?? '',
            shortDescriptionEn: category.shortDescriptionEn ?? '',
            shortDescriptionAr: category.shortDescriptionAr ?? '',
            thumbnail: category.thumbnail ? publicUrl(category.thumbnail) : '',
            heroImage: category.heroImage ? publicUrl(category.heroImage) : '',
            featured: category.featured ?? false,
            sortOrder: category.sortOrder ?? 0,
            isActive: category.isActive ?? true,
            seoTitle: category.seoTitle ?? '',
            seoDescription: category.seoDescription ?? '',
          }}
        />
      </div>
    </div>
  );
}

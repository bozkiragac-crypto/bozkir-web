import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { brands } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { BrandForm } from '@/components/admin/BrandForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBrandPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  if (!db) notFound();

  const rows = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  const brand = rows[0];
  if (!brand) notFound();

  return (
    <div>
      <Link href="/admin/bayilikler" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bayilikler
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Markayı Düzenle</h1>
      <p className="mt-1 text-sm text-muted">{brand.name}</p>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <BrandForm
          initial={{
            id: brand.id,
            name: brand.name,
            logo: brand.logo ? publicUrl(brand.logo) : '',
            url: brand.url ?? '',
            category: brand.category ?? '',
            categoryEn: brand.categoryEn ?? '',
            categoryAr: brand.categoryAr ?? '',
            description: brand.description ?? '',
            sortOrder: brand.sortOrder ?? 0,
            isActive: brand.isActive ?? true,
          }}
        />
      </div>
    </div>
  );
}

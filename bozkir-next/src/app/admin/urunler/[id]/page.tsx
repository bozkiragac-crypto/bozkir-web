import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { getCategories } from '@/lib/api/categories';
import { parseImageField } from '@/lib/media';
import { publicUrl } from '@/lib/storage/s3';
import { ProductForm } from '@/components/admin/ProductForm';
import { DeleteProductButton } from '@/components/admin/DeleteButtons';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  if (!db) notFound();

  const [rows, categories] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    getCategories(),
  ]);
  const product = rows[0];
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/urunler"
        className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Ürünler
      </Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Ürünü Düzenle</h1>
          <p className="numerals mt-1 text-sm text-muted">
            {product.code} · {product.name}
          </p>
        </div>
        <DeleteProductButton id={product.id} label="Ürünü sil" redirectTo="/admin/urunler" />
      </div>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <ProductForm
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          initial={{
            id: product.id,
            name: product.name ?? '',
            code: product.code ?? '',
            cat: product.cat ?? '',
            face: product.face ?? '',
            colors: product.colors ?? '',
            thicknesses: product.thicknesses ?? '',
            images: parseImageField(product.img).map((value) => publicUrl(value)),
            nameEn: product.nameEn ?? '',
            nameAr: product.nameAr ?? '',
            catEn: product.catEn ?? '',
            catAr: product.catAr ?? '',
            seoTitle: product.seoTitle ?? '',
            seoDescription: product.seoDescription ?? '',
            whatsappMessage: product.whatsappMessage ?? '',
            whatsappMessageEn: product.whatsappMessageEn ?? '',
            whatsappMessageAr: product.whatsappMessageAr ?? '',
          }}
        />
      </div>
    </div>
  );
}

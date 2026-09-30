import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCategories } from '@/lib/api/categories';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <Link href="/admin/urunler" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Ürünler
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Yeni Ürün</h1>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <ProductForm categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      </div>
    </div>
  );
}

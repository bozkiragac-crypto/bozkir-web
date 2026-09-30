import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <Link href="/admin/kategoriler" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kategoriler
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Yeni Kategori</h1>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <CategoryForm />
      </div>
    </div>
  );
}

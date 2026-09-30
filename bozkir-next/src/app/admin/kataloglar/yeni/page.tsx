import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CatalogForm } from '@/components/admin/CatalogForm';

export default function NewCatalogPage() {
  return (
    <div>
      <Link href="/admin/kataloglar" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kataloglar
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Yeni Katalog</h1>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <CatalogForm />
      </div>
    </div>
  );
}

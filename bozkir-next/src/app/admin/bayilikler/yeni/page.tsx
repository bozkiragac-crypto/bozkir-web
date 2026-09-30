import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandForm } from '@/components/admin/BrandForm';

export default function NewBrandPage() {
  return (
    <div>
      <Link href="/admin/bayilikler" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Bayilikler
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Yeni Marka</h1>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <BrandForm />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import {
  deleteProduct,
  deleteCampaign,
  deleteQuoteRequest,
  deleteCatalog,
  deleteCategory,
  deleteBrand,
} from '@/app/admin/actions';

function useDelete(action: (id: string) => Promise<{ ok: boolean; error?: string }>, message: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(id: string) {
    if (!confirm(message)) return;
    setBusy(true);
    const res = await action(id);
    setBusy(false);
    if (!res.ok) {
      alert(res.error ?? 'Silinemedi.');
      return;
    }
    router.refresh();
  }

  return { run, busy };
}

const btn =
  'inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-strong transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50';

function DeleteButton({
  action,
  message,
  id,
}: {
  action: (id: string) => Promise<{ ok: boolean; error?: string }>;
  message: string;
  id: string;
}) {
  const { run, busy } = useDelete(action, message);
  return (
    <button type="button" disabled={busy} onClick={() => run(id)} className={btn}>
      <Trash2 className="h-3.5 w-3.5" /> Sil
    </button>
  );
}

export function DeleteProductButton({ id }: { id: string }) {
  return <DeleteButton action={deleteProduct} message="Bu ürünü silmek istediğinize emin misiniz?" id={id} />;
}

export function DeleteCampaignButton({ id }: { id: string }) {
  return <DeleteButton action={deleteCampaign} message="Bu kampanyayı silmek istediğinize emin misiniz?" id={id} />;
}

export function DeleteCatalogButton({ id }: { id: string }) {
  return <DeleteButton action={deleteCatalog} message="Bu kataloğu silmek istediğinize emin misiniz?" id={id} />;
}

export function DeleteCategoryButton({ id }: { id: string }) {
  return <DeleteButton action={deleteCategory} message="Bu kategoriyi silmek istediğinize emin misiniz?" id={id} />;
}

export function DeleteBrandButton({ id }: { id: string }) {
  return <DeleteButton action={deleteBrand} message="Bu markayı silmek istediğinize emin misiniz?" id={id} />;
}

export function DeleteQuoteButton({ id }: { id: string }) {
  return <DeleteButton action={deleteQuoteRequest} message="Bu teklif talebini silmek istediğinize emin misiniz?" id={id} />;
}

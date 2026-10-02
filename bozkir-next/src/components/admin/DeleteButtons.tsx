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

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const [block, setBlock] = useState<{ count: number; samples: string[]; error: string } | null>(null);

  async function run(mode: 'block' | 'cascade' | 'deactivate') {
    setBusy(true);
    const res = await deleteCategory(id, mode);
    setBusy(false);

    if (res.ok) {
      setAsk(false);
      setBlock(null);
      router.refresh();
      return;
    }

    // Bağlı ürün varsa üç seçenekli karar ekranı açılır.
    if (typeof res.productCount === 'number' && res.productCount > 0) {
      setBlock({
        count: res.productCount,
        samples: res.samples ?? [],
        error: res.error ?? '',
      });
      return;
    }
    alert(res.error ?? 'Silinemedi.');
  }

  if (block) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-del-title"
          className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-xl"
        >
          <h2 id="cat-del-title" className="text-sm font-semibold text-fg">
            &quot;{name}&quot; kategorisi silinemez
          </h2>
          <p className="mt-2 text-xs text-muted-strong">{block.error}</p>

          {block.samples.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-md bg-surface-2 p-3 text-xs text-muted-strong">
              {block.samples.map((s) => (
                <li key={s} className="truncate">
                  • {s}
                </li>
              ))}
              {block.count > block.samples.length && (
                <li className="text-muted">ve {block.count - block.samples.length} ürün daha</li>
              )}
            </ul>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run('deactivate')}
              className="w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              Kategoriyi pasifleştir · {block.count} ürün korunur
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    `Bu kategorideki ${block.count} ürün kalıcı olarak silinecek. Emin misiniz?`,
                  )
                ) {
                  run('cascade');
                }
              }}
              className="w-full rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Ürünleri de sil ve kategoriyi kaldır
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setBlock(null)}
              className="w-full rounded-md px-3 py-2 text-xs text-muted-strong transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (ask) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-del-ask-title"
          className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl"
        >
          <h2 id="cat-del-ask-title" className="text-sm font-semibold text-fg">
            Bu kategoriyi silmek istediğinize emin misiniz?
          </h2>
          <p className="mt-2 text-xs text-muted-strong">
            Bağlı ürün varsa silme durdurulur; o durumda üç seçenek sunulur.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run('block')}
              className="w-full rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Sil
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAsk(false)}
              className="w-full rounded-md px-3 py-2 text-xs text-muted-strong transition-colors hover:bg-surface-2"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" disabled={busy} onClick={() => setAsk(true)} className={btn}>
      <Trash2 className="h-3.5 w-3.5" /> Sil
    </button>
  );
}

export function DeleteBrandButton({ id }: { id: string }) {
  return <DeleteButton action={deleteBrand} message="Bu markayı silmek istediğinize emin misiniz?" id={id} />;
}

export function DeleteQuoteButton({ id }: { id: string }) {
  return <DeleteButton action={deleteQuoteRequest} message="Bu teklif talebini silmek istediğinize emin misiniz?" id={id} />;
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { saveContentItem, deleteContentItem, type ContentItemInput } from '@/app/admin/actions';
import { ImageManager } from './ImageManager';

export interface EditableItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  tag: string;
  sortOrder: number;
  isActive: boolean;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  tagEn?: string;
  tagAr?: string;
}

const UUID = /^[0-9a-fA-F-]{36}$/;
const field =
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-foreground';
const area =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-foreground';

function toInput(blockKey: string, item: EditableItem): ContentItemInput {
  return {
    id: UUID.test(item.id) ? item.id : undefined,
    blockKey,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    tag: item.tag,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    titleEn: item.titleEn,
    titleAr: item.titleAr,
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    tagEn: item.tagEn,
    tagAr: item.tagAr,
  };
}

function ItemCard({
  blockKey,
  item,
  onDeleted,
}: {
  blockKey: string;
  item: EditableItem;
  onDeleted: () => void;
}) {
  const [state, setState] = useState<EditableItem>(item);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof EditableItem>(key: K, value: EditableItem[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await saveContentItem(toInput(blockKey, state));
    setBusy(false);
    setMsg(res.ok ? 'Kaydedildi' : res.error ?? 'Hata');
  }

  async function remove() {
    if (!UUID.test(item.id)) {
      onDeleted();
      return;
    }
    if (!confirm('Bu öğe silinsin mi?')) return;
    setBusy(true);
    await deleteContentItem(item.id);
    setBusy(false);
    onDeleted();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={state.title} onChange={(e) => set('title', e.target.value)} placeholder="Başlık" className={field} />
        <input value={state.tag} onChange={(e) => set('tag', e.target.value)} placeholder="Etiket (opsiyonel)" className={field} />
        <input
          value={state.linkUrl}
          onChange={(e) => set('linkUrl', e.target.value)}
          placeholder="Bağlantı (opsiyonel)"
          className={field}
        />
        <div className="flex items-center gap-3">
          <input
            value={state.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value) || 0)}
            inputMode="numeric"
            placeholder="Sıra"
            className={field}
          />
          <label className="flex items-center gap-2 whitespace-nowrap text-sm">
            <input type="checkbox" checked={state.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Aktif
          </label>
        </div>
        <textarea
          value={state.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Açıklama / cevap"
          rows={3}
          className={`${area} sm:col-span-2`}
        />
        <div className="grid gap-3 rounded-md border border-dashed border-border p-3 sm:col-span-2">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">Çeviriler (boşsa Türkçe)</p>
          <input value={state.titleEn} onChange={(e) => set('titleEn', e.target.value)} placeholder="Başlık (EN)" className={field} />
          <input value={state.titleAr} onChange={(e) => set('titleAr', e.target.value)} placeholder="Başlık (AR)" dir="rtl" className={field} />
          <textarea value={state.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} placeholder="Açıklama (EN)" rows={2} className={area} />
          <textarea value={state.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} placeholder="Açıklama (AR)" rows={2} dir="rtl" className={area} />
          <input value={state.tagEn} onChange={(e) => set('tagEn', e.target.value)} placeholder="Etiket (EN)" className={field} />
          <input value={state.tagAr} onChange={(e) => set('tagAr', e.target.value)} placeholder="Etiket (AR)" dir="rtl" className={field} />
        </div>
      </div>

      <div className="mt-4">
        <ImageManager
          images={state.imageUrl ? [state.imageUrl] : []}
          onChange={(next) => set('imageUrl', next[0] ?? '')}
          folder="content"
          multiple={false}
          label="Görsel"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background disabled:opacity-50"
        >
          {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button
          type="button"
          onClick={remove}
          className="inline-flex items-center gap-1.5 text-xs text-muted-strong hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" /> Sil
        </button>
        {msg && <span className="text-xs text-muted-strong">{msg}</span>}
      </div>
    </div>
  );
}

export function ContentItemsEditor({ blockKey, items }: { blockKey: string; items: EditableItem[] }) {
  const router = useRouter();
  const [list, setList] = useState<EditableItem[]>(items);

  function addNew() {
    setList((l) => [
      ...l,
      {
        id: `new-${Date.now()}`,
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        tag: '',
        sortOrder: l.length,
        isActive: true,
        titleEn: '',
        titleAr: '',
        descriptionEn: '',
        descriptionAr: '',
        tagEn: '',
        tagAr: '',
      },
    ]);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium tracking-wide uppercase">Öğeler ({list.length})</h2>
        <button
          type="button"
          onClick={addNew}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-surface-2"
        >
          <Plus className="h-3.5 w-3.5" /> Yeni Öğe
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        {list.map((item) => (
          <ItemCard
            key={item.id}
            blockKey={blockKey}
            item={item}
            onDeleted={() => {
              setList((l) => l.filter((x) => x.id !== item.id));
              router.refresh();
            }}
          />
        ))}
        {list.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted">
            Henüz öğe yok.
          </p>
        )}
      </div>
    </div>
  );
}

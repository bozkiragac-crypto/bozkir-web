import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { ArrowUpRight } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { contentBlocks, contentItems } from '@/lib/db/schema';
import { fallbackContent } from '@/data/content';

const BLOCKS: { key: string; label: string; hint: string }[] = [
  { key: 'gallery', label: 'Galeri', hint: 'Gerçek fotoğraf mozaiği' },
  { key: 'guide', label: 'Malzeme Rehberi', hint: 'Hangi iş için hangi panel' },
  { key: 'applications', label: 'Uygulama Alanları', hint: 'Mutfak, kapı, dolap…' },
  { key: 'process', label: 'Süreç', hint: 'Talepten teslimata adımlar' },
  { key: 'faq', label: 'SSS', hint: 'Sıkça sorulan sorular' },
];

export default async function AdminContentPage() {
  const db = getDb();
  if (!db) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Veritabanı bağlantısı yok.</p>;
  }

  const [blocks, items] = await Promise.all([
    db.select().from(contentBlocks).orderBy(asc(contentBlocks.sortOrder)),
    db.select({ blockKey: contentItems.blockKey }).from(contentItems),
  ]);

  const titleByKey = new Map(blocks.map((b) => [b.key, b.title]));
  const activeByKey = new Map(blocks.map((b) => [b.key, b.isActive]));
  const countByKey = new Map<string, number>();
  items.forEach((i) => countByKey.set(i.blockKey, (countByKey.get(i.blockKey) ?? 0) + 1));

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">İçerik</h1>
      <p className="mt-1 text-sm text-muted-strong">
        Ana sayfa bölümlerini ve öğelerini yönetin. İlk açılışta varsayılan taslak metinler görünür.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {BLOCKS.map((b) => {
          const count = countByKey.get(b.key) ?? 0;
          const title = titleByKey.get(b.key) || fallbackContent[b.key]?.title || b.label;
          const active = activeByKey.has(b.key) ? activeByKey.get(b.key) : true;
          return (
            <Link
              key={b.key}
              href={`/admin/icerik/${b.key}`}
              className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-[0.14em] text-muted uppercase">{b.label}</span>
                <ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-4 text-lg font-medium tracking-tight">{title}</p>
              <p className="mt-1 text-sm text-muted-strong">{b.hint}</p>
              <p className="numerals mt-4 text-xs text-muted">
                {count} öğe · {active ? 'aktif' : 'pasif'}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

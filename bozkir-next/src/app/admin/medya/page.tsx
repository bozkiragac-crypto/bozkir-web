import { getDb } from '@/lib/db/client';
import { brands, campaigns, catalogs, categories, contentItems, products } from '@/lib/db/schema';
import { listObjects, publicUrl, toObjectKey, storageConfigured } from '@/lib/storage/s3';
import { parseImageField } from '@/lib/media';
import { getCurrentAdmin } from '@/lib/admin/guard';
import { MediaLibrary, type MediaItem } from '@/components/admin/MediaLibrary';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;
const BASE_FOLDERS = ['products', 'campaigns', 'content', 'catalogs'] as const;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

export default async function AdminMediaPage({ searchParams }: PageProps) {
  if (!storageConfigured()) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Depolama yapılandırılmadı.</p>;
  }

  const sp = await searchParams;
  const q = str(sp.q).trim().toLowerCase();
  const requestedFolder = str(sp.klasor);
  const page = Math.max(1, parseInt(str(sp.sayfa) || '1', 10) || 1);

  const admin = await getCurrentAdmin();
  const isOwner = admin?.role === 'owner';
  // quotes/ müşteri eklerini yalnızca sahip görebilir.
  const folders: string[] = [...BASE_FOLDERS, ...(isOwner ? ['quotes'] : [])];
  const folder = folders.includes(requestedFolder) ? requestedFolder : 'all';

  const db = getDb();
  const usedKeys = new Set<string>();
  if (db) {
    const [p, c, ci, cat, br, katalog] = await Promise.all([
      db.select({ img: products.img }).from(products),
      db.select({ imageUrl: campaigns.imageUrl }).from(campaigns),
      db.select({ imageUrl: contentItems.imageUrl }).from(contentItems),
      db.select({ thumbnail: categories.thumbnail, heroImage: categories.heroImage }).from(categories),
      db.select({ logo: brands.logo }).from(brands),
      db.select({ cover: catalogs.cover, pdfUrl: catalogs.pdfUrl }).from(catalogs),
    ]);
    for (const row of p) {
      for (const v of parseImageField(row.img ?? '')) {
        const k = toObjectKey(v);
        if (k) usedKeys.add(k);
      }
    }
    for (const row of [...c, ...ci]) {
      const k = row.imageUrl ? toObjectKey(row.imageUrl) : null;
      if (k) usedKeys.add(k);
    }
    for (const row of cat) {
      for (const v of [row.thumbnail, row.heroImage]) {
        const k = v ? toObjectKey(v) : null;
        if (k) usedKeys.add(k);
      }
    }
    for (const row of br) {
      const k = row.logo ? toObjectKey(row.logo) : null;
      if (k) usedKeys.add(k);
    }
    for (const row of katalog) {
      for (const v of [row.cover, row.pdfUrl]) {
        const k = v ? toObjectKey(v) : null;
        if (k) usedKeys.add(k);
      }
    }
  }

  // Yalnızca seçili klasörü listele; "Tümü" için hepsini çek.
  const prefixes = folder === 'all' ? folders.map((f) => `${f}/`) : [`${folder}/`];
  const lists = await Promise.all(prefixes.map((p) => listObjects(p, 2000)));
  const objects = lists.flat();

  const filtered = objects
    .filter((o) => (folder === 'all' || o.key.startsWith(`${folder}/`)) && (!q || o.key.toLowerCase().includes(q)))
    .sort((a, b) => (a.lastModified < b.lastModified ? 1 : -1));

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const items: MediaItem[] = slice.map((o) => ({
    key: o.key,
    url: publicUrl(o.key),
    size: o.size,
    lastModified: o.lastModified,
    inUse: usedKeys.has(o.key),
  }));

  return (
    <MediaLibrary
      items={items}
      page={current}
      totalPages={totalPages}
      total={total}
      folder={folder}
      q={q}
      folders={folders}
    />
  );
}

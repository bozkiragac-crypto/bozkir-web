import { getDb } from '@/lib/db/client';
import { campaigns, contentItems, products } from '@/lib/db/schema';
import { listObjects, publicUrl, toObjectKey, storageConfigured } from '@/lib/storage/s3';
import { parseImageField } from '@/lib/media';
import { MediaLibrary, type MediaItem } from '@/components/admin/MediaLibrary';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  if (!storageConfigured()) {
    return <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Depolama yapılandırılmadı.</p>;
  }

  const db = getDb();
  const usedKeys = new Set<string>();
  if (db) {
    const [p, c, ci] = await Promise.all([
      db.select({ img: products.img }).from(products),
      db.select({ imageUrl: campaigns.imageUrl }).from(campaigns),
      db.select({ imageUrl: contentItems.imageUrl }).from(contentItems),
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
  }

  const [productObjs, campaignObjs, contentObjs] = await Promise.all([
    listObjects('products/'),
    listObjects('campaigns/'),
    listObjects('content/'),
  ]);

  const items: MediaItem[] = [...productObjs, ...campaignObjs, ...contentObjs]
    .sort((a, b) => (a.lastModified < b.lastModified ? 1 : -1))
    .map((o) => ({
      key: o.key,
      url: publicUrl(o.key),
      size: o.size,
      lastModified: o.lastModified,
      inUse: usedKeys.has(o.key),
    }));

  return <MediaLibrary items={items} />;
}

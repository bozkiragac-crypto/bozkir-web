import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { products } from '@/lib/db/schema';

export interface AuditProductRow {
  id: string;
  name: string | null;
  code: string | null;
  img: string | null;
  description: string | null;
  shortDescription: string | null;
}

export interface ContentAuditIssue extends AuditProductRow {
  missingImage: boolean;
  missingDescription: boolean;
}

export interface ContentAudit {
  total: number;
  missingImageCount: number;
  missingDescriptionCount: number;
  affectedCount: number;
  samples: ContentAuditIssue[];
}

const SAMPLE_LIMIT = 5;

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Ürün satırlarından panel uyarısı için özet çıkarır. Saf fonksiyon olduğu
 * için DB/S3'e ihtiyaç duymadan test edilebilir.
 */
export function summarizeContentAudit(
  rows: readonly AuditProductRow[],
  limit = SAMPLE_LIMIT,
): ContentAudit {
  let missingImageCount = 0;
  let missingDescriptionCount = 0;
  let affectedCount = 0;
  const samples: ContentAuditIssue[] = [];

  for (const row of rows) {
    const missingImage = !hasText(row.img);
    const missingDescription = !hasText(row.description) && !hasText(row.shortDescription);
    if (missingImage) missingImageCount += 1;
    if (missingDescription) missingDescriptionCount += 1;
    if (!missingImage && !missingDescription) continue;

    affectedCount += 1;
    if (samples.length < limit) {
      samples.push({ ...row, missingImage, missingDescription });
    }
  }

  return {
    total: rows.length,
    missingImageCount,
    missingDescriptionCount,
    affectedCount,
    samples,
  };
}

/** Aktif ürünler için içerik denetimi özeti. */
export async function fetchContentAudit(): Promise<ContentAudit> {
  const db = getDb();
  if (!db) return summarizeContentAudit([]);

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      img: products.img,
      description: products.description,
      shortDescription: products.shortDescription,
    })
    .from(products)
    .where(eq(products.isActive, true));

  return summarizeContentAudit(rows);
}

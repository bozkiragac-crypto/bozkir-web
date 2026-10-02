import { and, eq, gte, ilike, or, type SQL } from 'drizzle-orm';
import { activityLog } from '@/lib/db/schema';

export const ACTION_LABEL: Record<string, string> = {
  login: 'Giriş',
  logout: 'Çıkış',
  login_failed: 'Başarısız giriş',
  create: 'Ekleme',
  update: 'Güncelleme',
  delete: 'Silme',
  upload: 'Yükleme',
};

export const RANGE_LABEL: Record<string, string> = {
  '24s': 'Son 24 saat',
  '7g': 'Son 7 gün',
  '30g': 'Son 30 gün',
};

export interface ActivityFilters {
  q: string;
  aralik: string;
  islem: string;
  varlik: string;
}

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

export function parseActivityFilters(sp: Record<string, string | string[] | undefined>): ActivityFilters {
  return {
    q: str(sp.q).trim(),
    aralik: RANGE_LABEL[str(sp.aralik)] ? str(sp.aralik) : '',
    islem: str(sp.islem),
    varlik: str(sp.varlik),
  };
}

export function rangeStart(aralik: string): Date | undefined {
  const now = Date.now();
  if (aralik === '24s') return new Date(now - 24 * 60 * 60 * 1000);
  if (aralik === '7g') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (aralik === '30g') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return undefined;
}

export function activityWhere(f: ActivityFilters): SQL | undefined {
  const conds: SQL[] = [];
  if (f.q) {
    const like = `%${f.q}%`;
    const search = or(ilike(activityLog.summary, like), ilike(activityLog.username, like));
    if (search) conds.push(search);
  }
  const start = rangeStart(f.aralik);
  if (start) conds.push(gte(activityLog.createdAt, start));
  if (f.islem) conds.push(eq(activityLog.action, f.islem));
  if (f.varlik) conds.push(eq(activityLog.entity, f.varlik));
  return conds.length ? and(...conds) : undefined;
}

export function activityQueryString(f: ActivityFilters, sayfa = 1): string {
  const qs = new URLSearchParams();
  if (f.q) qs.set('q', f.q);
  if (f.aralik) qs.set('aralik', f.aralik);
  if (f.islem) qs.set('islem', f.islem);
  if (f.varlik) qs.set('varlik', f.varlik);
  if (sayfa > 1) qs.set('sayfa', String(sayfa));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

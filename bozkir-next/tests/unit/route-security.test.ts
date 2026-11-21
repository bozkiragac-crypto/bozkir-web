import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurrentAdmin, getDb, storageConfigured, toObjectKey, getObject } = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  getDb: vi.fn(),
  storageConfigured: vi.fn(),
  toObjectKey: vi.fn((v: string) => {
    if (typeof v !== 'string') return null;
    if (v.startsWith('/media/')) return v.slice('/media/'.length);
    if (!v.includes('://') && !v.startsWith('/') && !v.startsWith('data:')) return v;
    return null;
  }),
  getObject: vi.fn(),
}));

vi.mock('@/lib/admin/guard', () => ({ getCurrentAdmin }));
vi.mock('@/lib/db/client', () => ({ getDb }));
vi.mock('@/lib/storage/s3', () => ({
  getObject,
  storageConfigured,
  toObjectKey,
}));

vi.mock('@/lib/db/schema', () => ({
  quoteRequests: {
    id: 'id',
    attachmentKey: 'attachmentKey',
    attachmentName: 'attachmentName',
    createdAt: 'createdAt',
  },
  activityLog: { createdAt: 'createdAt' },
}));

vi.mock('@/lib/activity', () => ({
  ACTION_LABEL: { login: 'Giriş' },
  parseActivityFilters: () => ({}),
  activityWhere: () => undefined,
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => args,
  desc: (v: unknown) => v,
  eq: (...args: unknown[]) => args,
  ilike: (...args: unknown[]) => args,
  or: (...args: unknown[]) => args,
}));

import { GET as quoteAttachmentGet } from '@/app/api/quote-attachment/route';
import { GET as quoteExportGet } from '@/app/api/admin/quote-export/route';
import { GET as activityExportGet } from '@/app/api/admin/activity-export/route';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

function mockQuoteDb(rows: unknown[]) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => rows,
          orderBy: () => ({ limit: async () => rows }),
        }),
        orderBy: () => ({ limit: async () => rows }),
      }),
    }),
  };
}

function mockActivityDb(rows: unknown[]) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({ orderBy: () => ({ limit: async () => rows }) }),
        orderBy: () => ({ limit: async () => rows }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  toObjectKey.mockImplementation((v: string) => {
    if (typeof v !== 'string') return null;
    if (v.startsWith('/media/')) return v.slice('/media/'.length);
    if (!v.includes('://') && !v.startsWith('/') && !v.startsWith('data:')) return v;
    return null;
  });
});

describe('quote-attachment route hardening', () => {
  it('yetkisiz istek 401 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue(null);
    const res = await quoteAttachmentGet(
      new Request(`http://localhost/api/quote-attachment?id=${VALID_UUID}`),
    );
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('geçersiz id 400 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    const res = await quoteAttachmentGet(
      new Request('http://localhost/api/quote-attachment?id=not-a-uuid'),
    );
    expect(res.status).toBe(400);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(getDb).not.toHaveBeenCalled();
  });

  it('db yoksa 503 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(null);
    const res = await quoteAttachmentGet(
      new Request(`http://localhost/api/quote-attachment?id=${VALID_UUID}`),
    );
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('ek bulunamazsa 404 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(mockQuoteDb([{ key: null, name: null }]));
    const res = await quoteAttachmentGet(
      new Request(`http://localhost/api/quote-attachment?id=${VALID_UUID}`),
    );
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('depolama yoksa 503 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(mockQuoteDb([{ key: 'quotes/a.pdf', name: 'a.pdf' }]));
    storageConfigured.mockReturnValue(false);
    const res = await quoteAttachmentGet(
      new Request(`http://localhost/api/quote-attachment?id=${VALID_UUID}`),
    );
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('quotes dışı key reddedilir (404, no-store)', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(mockQuoteDb([{ key: 'products/x.png', name: 'x.png' }]));
    storageConfigured.mockReturnValue(true);
    const res = await quoteAttachmentGet(
      new Request(`http://localhost/api/quote-attachment?id=${VALID_UUID}`),
    );
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(getObject).not.toHaveBeenCalled();
  });

  it('geçerli ek güvenli headerlarla indirilir', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(mockQuoteDb([{ key: 'quotes/teklif.pdf', name: 'teklif "özel".pdf' }]));
    storageConfigured.mockReturnValue(true);
    getObject.mockResolvedValue({ bytes: new Uint8Array([1, 2, 3]), contentType: 'application/pdf' });
    const res = await quoteAttachmentGet(
      new Request(`http://localhost/api/quote-attachment?id=${VALID_UUID}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('private');
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-type')).toBe('application/pdf');
    const cd = res.headers.get('content-disposition') ?? '';
    expect(cd).toContain('attachment;');
    expect(cd).not.toContain('\n');
    expect(cd).toContain("filename*=UTF-8''");
  });
});

describe('admin export routes hardening', () => {
  it('quote-export yetkisiz 401 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue(null);
    const res = await quoteExportGet(new Request('http://localhost/api/admin/quote-export'));
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('quote-export db yoksa 503 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(null);
    const res = await quoteExportGet(new Request('http://localhost/api/admin/quote-export'));
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('quote-export yetkili CSV ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(
      mockQuoteDb([
        {
          createdAt: new Date('2026-01-01T00:00:00Z'),
          id: VALID_UUID,
          status: 'new',
          fullName: 'A',
          company: 'C',
          email: 'a@b.c',
          phone: '1',
          city: 'X',
          product: 'P',
          quantity: '1',
          project: '',
          message: '',
          lang: 'tr',
          attachmentName: '',
        },
      ]),
    );
    const res = await quoteExportGet(new Request('http://localhost/api/admin/quote-export'));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('private');
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toMatch(/teklifler-\d{4}-\d{2}-\d{2}\.csv/);
    const text = await res.text();
    expect(text).toContain('Tarih');
    expect(text).toContain('Ad Soyad');
    expect(text).toContain('a@b.c');
  });

  it('activity-export yetkisiz 401 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue(null);
    const res = await activityExportGet(new Request('http://localhost/api/admin/activity-export'));
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('activity-export db yoksa 503 ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(null);
    const res = await activityExportGet(new Request('http://localhost/api/admin/activity-export'));
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('activity-export yetkili CSV ve no-store döner', async () => {
    getCurrentAdmin.mockResolvedValue({ id: 'admin', role: 'owner' });
    getDb.mockReturnValue(
      mockActivityDb([
        {
          createdAt: new Date('2026-01-01T00:00:00Z'),
          username: 'Admin',
          action: 'login',
          entity: 'auth',
          entityId: '1',
          summary: 'Giriş yapıldı',
          ip: '127.0.0.1',
        },
      ]),
    );
    const res = await activityExportGet(new Request('http://localhost/api/admin/activity-export'));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('private');
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toMatch(/aktivite-\d{4}-\d{2}-\d{2}\.csv/);
    const text = await res.text();
    expect(text).toContain('Tarih');
    expect(text).toContain('Admin');
    expect(text).toContain('Giriş');
    expect(text).toContain('Giriş yapıldı');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getDb,
  compare,
  createSession,
  logActivity,
  isRateLimitedSpy,
  resetRateLimitSpy,
  decryptTotpSecret,
  verifyTotp,
} = vi.hoisted(() => ({
  getDb: vi.fn(),
  compare: vi.fn(),
  createSession: vi.fn(async () => undefined),
  logActivity: vi.fn(async () => undefined),
  isRateLimitedSpy: vi.fn(),
  resetRateLimitSpy: vi.fn(),
  decryptTotpSecret: vi.fn(() => 'JBSWY3DPEHPK3PXP'),
  verifyTotp: vi.fn(async () => false),
}));

vi.mock('bcryptjs', () => ({ default: { compare } }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-real-ip': '1.2.3.4' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ getDb }));
vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => args,
  eq: (...args: unknown[]) => args,
  inArray: (...args: unknown[]) => args,
  or: (...args: unknown[]) => args,
}));
vi.mock('@/lib/db/schema', () => ({
  adminUsers: {
    id: 'id',
    username: 'username',
    email: 'email',
    isActive: 'isActive',
    passwordHash: 'passwordHash',
    failedAttempts: 'failedAttempts',
    lockedUntil: 'lockedUntil',
    totpEnabled: 'totpEnabled',
    totpSecret: 'totpSecret',
    lastLoginAt: 'lastLoginAt',
    role: 'role',
    name: 'name',
  },
  brands: {},
  campaigns: {},
  catalogs: {},
  categories: {},
  contentBlocks: {},
  contentItems: {},
  products: {},
  quoteRequests: {},
}));
vi.mock('@/lib/auth/session', () => ({ createSession, destroySession: vi.fn() }));
vi.mock('@/lib/admin/guard', () => ({
  logActivity,
  getCurrentAdmin: vi.fn(),
  requireAdminUser: vi.fn(),
  requireOwner: vi.fn(),
}));
vi.mock('@/lib/auth/totp', () => ({
  createTotpSecret: vi.fn(),
  totpKeyUri: vi.fn(),
  verifyTotp,
}));
vi.mock('@/lib/auth/totp-crypto', () => ({ decryptTotpSecret, encryptTotpSecret: vi.fn() }));
vi.mock('@/lib/media', () => ({
  parseImageField: vi.fn(),
  serializeImageField: vi.fn(),
  validateUpload: vi.fn(),
  validateImageSignature: vi.fn(),
  MAX_PDF_MB: 10,
  ALLOWED_PDF_MIME: [],
}));
vi.mock('@/lib/image-optimize', () => ({ optimizeImage: vi.fn() }));
vi.mock('@/lib/safe-url', () => ({ safeHref: vi.fn() }));
vi.mock('@/lib/data/tags', () => ({
  DATA_TAGS: {
    products: 'products',
    content: 'content',
    campaigns: 'campaigns',
    catalogs: 'catalogs',
  },
}));
vi.mock('@/lib/storage/s3', () => ({
  deleteObject: vi.fn(),
  putObject: vi.fn(),
  publicUrl: vi.fn(),
  toObjectKey: vi.fn(),
}));
vi.mock('@/lib/csv', () => ({ parseCsv: vi.fn() }));
vi.mock('@/lib/data/category-key', () => ({ categorySlugOf: vi.fn() }));
vi.mock('@/lib/quotes/status', () => ({ isQuoteStatus: vi.fn(), QUOTE_STATUSES: [] }));
vi.mock('@/lib/slug', () => ({ slugify: vi.fn() }));
vi.mock('@/lib/product-availability', () => ({ parseAvailabilityStatus: vi.fn() }));
vi.mock('@/lib/ratelimit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ratelimit')>();
  return {
    ...actual,
    isRateLimited: (...args: Parameters<typeof actual.isRateLimited>) => {
      isRateLimitedSpy(...args);
      return actual.isRateLimited(...args);
    },
    resetRateLimit: (...args: Parameters<typeof actual.resetRateLimit>) => {
      resetRateLimitSpy(...args);
      return actual.resetRateLimit(...args);
    },
  };
});

import { signIn } from '@/app/admin/actions';

const updates: Record<string, unknown>[] = [];
let user: Record<string, unknown> | null = null;

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    username: 'bozkir',
    email: 'bozkir@example.com',
    isActive: true,
    passwordHash: 'hash',
    failedAttempts: 0,
    lockedUntil: null,
    totpEnabled: false,
    totpSecret: null,
    role: 'owner',
    name: 'Bozkır',
    ...overrides,
  };
}

beforeEach(() => {
  updates.length = 0;
  user = baseUser();
  compare.mockReset();
  logActivity.mockReset();
  isRateLimitedSpy.mockClear();
  resetRateLimitSpy.mockClear();
  getDb.mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (user ? [user] : []) }),
      }),
    }),
    update: () => ({
      set: (patch: Record<string, unknown>) => {
        updates.push(patch);
        return { where: async () => undefined };
      },
    }),
  });
});

describe('admin giriş hız sınırı', () => {
  it('başkasının kilitlediği hesapta doğru şifre giriş yapabilir ve kilidi temizler', async () => {
    user = baseUser({
      failedAttempts: 5,
      lockedUntil: new Date(Date.now() + 10 * 60_000),
    });
    compare.mockResolvedValue(true);

    const res = await signIn('bozkir', 'dogru-sifre');

    expect(res).toEqual({ ok: true });
    expect(isRateLimitedSpy).not.toHaveBeenCalled();
    expect(updates.some((u) => u.failedAttempts === 0 && u.lockedUntil === null)).toBe(true);
    expect(resetRateLimitSpy).toHaveBeenCalledWith('login:bozkir:1.2.3.4');
    expect(resetRateLimitSpy).toHaveBeenCalledWith('login-ip:1.2.3.4');
  });

  it('yalnızca yanlış şifre denemeleri hesap ve IP sayacını tutar', async () => {
    compare.mockResolvedValue(false);

    const res = await signIn('bozkir', 'yanlis-sifre');

    expect(res.ok).toBe(false);
    expect(isRateLimitedSpy).toHaveBeenCalledWith('login:bozkir:1.2.3.4', 10);
    expect(isRateLimitedSpy).toHaveBeenCalledWith('login-ip:1.2.3.4', 30);
    expect(isRateLimitedSpy).not.toHaveBeenCalledWith('login:bozkir', 10);
  });

  it('bilinmeyen kullanıcı hesap sayacını tüketmez', async () => {
    user = null;

    const res = await signIn('bilinmeyen', 'sifre');

    expect(res.ok).toBe(false);
    expect(res.error).toBe('Kullanıcı adı veya şifre hatalı.');
    expect(isRateLimitedSpy).not.toHaveBeenCalled();
  });

  it('doğru şifre sonrası hatalı 2FA kodu şifre kotasını tüketmez', async () => {
    user = baseUser({ totpEnabled: true, totpSecret: 'secret' });
    compare.mockResolvedValue(true);

    const res = await signIn('bozkir', 'dogru-sifre', '000000');

    expect(res.ok).toBe(false);
    expect(res.requiresTotp).toBe(true);
    expect(res.error).toBe('Doğrulama kodu hatalı.');
    expect(isRateLimitedSpy).not.toHaveBeenCalled();
    expect(updates.some((u) => u.failedAttempts === 0 && u.lockedUntil === null)).toBe(true);
  });
});

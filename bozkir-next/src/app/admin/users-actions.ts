'use server';

import bcrypt from 'bcryptjs';
import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { adminUsers } from '@/lib/db/schema';
import { logActivity, requireOwner } from '@/lib/admin/guard';

export interface UserInput {
  id?: string;
  username: string;
  name: string;
  email: string;
  role: 'owner' | 'editor';
  isActive: boolean;
  password?: string;
}

function normalize(input: UserInput) {
  return {
    username: input.username.trim().toLowerCase(),
    name: input.name.trim() || null,
    email: input.email.trim().toLowerCase() || null,
    role: input.role === 'editor' ? 'editor' : 'owner',
    isActive: input.isActive,
  };
}

export async function createUser(input: UserInput): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const data = normalize(input);
  if (!data.username || !/^[a-z0-9._-]{3,}$/.test(data.username)) {
    return { ok: false, error: 'Kullanıcı adı en az 3 karakter (harf/rakam/._-) olmalı.' };
  }
  if (!input.password || input.password.length < 8) {
    return { ok: false, error: 'Şifre en az 8 karakter olmalı.' };
  }

  const exists = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.username, data.username)).limit(1);
  if (exists.length) return { ok: false, error: 'Bu kullanıcı adı zaten kayıtlı.' };

  const passwordHash = await bcrypt.hash(input.password, 10);
  const inserted = await db.insert(adminUsers).values({ ...data, passwordHash }).returning({ id: adminUsers.id });
  await logActivity(admin, 'create', 'user', inserted[0]?.id, `Kullanıcı eklendi: ${data.username}`);
  revalidatePath('/admin/kullanicilar');
  return { ok: true };
}

export async function updateUser(input: UserInput & { id: string }): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const data = normalize(input);
  if (!data.username) return { ok: false, error: 'Kullanıcı adı zorunludur.' };

  const clash = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(and(eq(adminUsers.username, data.username), ne(adminUsers.id, input.id)))
    .limit(1);
  if (clash.length) return { ok: false, error: 'Bu kullanıcı adı başka bir hesapta kullanılıyor.' };

  const patch: Record<string, unknown> = { ...data };
  if (input.password) {
    if (input.password.length < 8) return { ok: false, error: 'Şifre en az 8 karakter olmalı.' };
    patch.passwordHash = await bcrypt.hash(input.password, 10);
  }

  await db.update(adminUsers).set(patch).where(eq(adminUsers.id, input.id));
  await logActivity(admin, 'update', 'user', input.id, `Kullanıcı güncellendi: ${data.username}`);
  revalidatePath('/admin/kullanicilar');
  return { ok: true };
}

export async function deleteUser(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  if (admin.id === id) return { ok: false, error: 'Kendi hesabınızı silemezsiniz.' };

  const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  const target = rows[0];
  if (!target) return { ok: false, error: 'Kullanıcı bulunamadı.' };

  if (target.role === 'owner') {
    const owners = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.role, 'owner'));
    if (owners.length <= 1) return { ok: false, error: 'Son sahip hesabı silinemez.' };
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  await logActivity(admin, 'delete', 'user', id, `Kullanıcı silindi: ${target.username ?? id}`);
  revalidatePath('/admin/kullanicilar');
  return { ok: true };
}

/** Owner: kullanıcının 2FA'sını sıfırlar (kurulumu tekrar yaptırmak için). */
export async function resetUserTotp(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireOwner();
  const db = getDb();
  if (!db) return { ok: false, error: 'Veritabanı bağlantısı yok.' };

  const rows = await db
    .select({ username: adminUsers.username, totpEnabled: adminUsers.totpEnabled })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  const target = rows[0];
  if (!target) return { ok: false, error: 'Kullanıcı bulunamadı.' };
  if (!target.totpEnabled) return { ok: false, error: 'Bu kullanıcıda etkin 2FA yok.' };

  await db
    .update(adminUsers)
    .set({ totpSecret: null, totpEnabled: false })
    .where(eq(adminUsers.id, id));
  await logActivity(admin, 'update', 'user', id, `2FA sıfırlandı: ${target.username ?? id}`);
  revalidatePath('/admin/kullanicilar');
  return { ok: true };
}

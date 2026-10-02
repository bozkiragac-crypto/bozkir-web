'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, KeyRound } from 'lucide-react';
import { createUser, updateUser, deleteUser, type UserInput } from '@/app/admin/users-actions';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/datetime';

export interface AdminUserRow {
  id: string;
  username: string | null;
  email: string | null;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

const field = 'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-foreground';

function fmt(d: string | null) {
  return formatDateTime(d);
}

export function UsersManager({ users, currentId }: { users: AdminUserRow[]; currentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'İşlem başarısız.');
    else router.refresh();
    return res.ok;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Kullanıcılar</h1>
          <p className="mt-1 text-sm text-muted-strong">{users.length} yönetici hesabı</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Yeni Kullanıcı
        </button>
      </div>

      {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {creating && <CreateForm busy={busy} onCancel={() => setCreating(false)} onSubmit={(input) => run(() => createUser(input)).then((ok) => ok && setCreating(false))} />}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-foreground">
            <tr>
              <th className="p-4 font-medium">Kullanıcı adı</th>
              <th className="p-4 font-medium">Ad</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium">Durum</th>
              <th className="p-4 font-medium">Son giriş</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === currentId} busy={busy} onRun={run} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: UserInput) => void;
}) {
  const [form, setForm] = useState<UserInput>({ username: '', name: '', email: '', role: 'editor', isActive: true, password: '' });
  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <p className="font-medium">Yeni kullanıcı</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Kullanıcı adı *</span>
          <input className={field} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Ad</span>
          <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">E-posta</span>
          <input className={field} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Rol</span>
          <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'owner' | 'editor' })}>
            <option value="editor">Editör</option>
            <option value="owner">Sahip</option>
          </select>
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">Şifre * (min 8)</span>
          <input className={field} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmit(form)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Kaydet
        </button>
        <button type="button" onClick={onCancel} className="h-11 rounded-full border border-border px-5 text-sm">
          İptal
        </button>
      </div>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  busy,
  onRun,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  busy: boolean;
  onRun: (fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserInput>({
    id: user.id,
    username: user.username ?? '',
    name: user.name ?? '',
    email: user.email ?? '',
    role: (user.role as 'owner' | 'editor') ?? 'editor',
    isActive: user.isActive,
    password: '',
  });

  if (editing) {
    return (
      <tr className="border-t border-border bg-surface-2/50">
        <td className="p-4">
          <input className={field} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </td>
        <td className="p-4">
          <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </td>
        <td className="p-4">
          <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'owner' | 'editor' })}>
            <option value="editor">Editör</option>
            <option value="owner">Sahip</option>
          </select>
        </td>
        <td className="p-4">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Aktif
          </label>
        </td>
        <td className="p-4">
          <input className={field} placeholder="Yeni şifre (ops.)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </td>
        <td className="p-4 text-right">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onRun(() => updateUser(form as UserInput & { id: string })).then((ok) => ok && setEditing(false))}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2"
            >
              Kaydet
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-border px-3 py-1.5 text-xs">
              İptal
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="p-4 font-medium">
        {user.username}
        {isSelf && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[0.6rem] uppercase text-muted">siz</span>}
      </td>
      <td className="p-4 text-muted-strong">{user.name ?? '—'}</td>
      <td className="p-4">
        <span className={cn('rounded-full px-2.5 py-1 text-xs', user.role === 'owner' ? 'bg-foreground text-background' : 'bg-surface-2 text-muted-strong')}>
          {user.role === 'owner' ? 'Sahip' : 'Editör'}
        </span>
      </td>
      <td className="p-4">
        <span className={cn('rounded-full px-2.5 py-1 text-xs', user.isActive ? 'bg-green-100 text-green-800' : 'bg-surface-2 text-muted-strong')}>
          {user.isActive ? 'Aktif' : 'Pasif'}
        </span>
      </td>
      <td className="p-4 text-muted-strong">{fmt(user.lastLoginAt)}</td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2"
          >
            <KeyRound className="h-3.5 w-3.5" /> Düzenle
          </button>
          {!isSelf && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm(`${user.username} silinsin mi?`)) onRun(() => deleteUser(user.id));
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-strong hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Sil
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

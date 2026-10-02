import { getCurrentAdmin } from '@/lib/admin/guard';
import { PasswordForm } from '@/components/admin/PasswordForm';
import { TotpSettings } from '@/components/admin/TotpSettings';
import { formatDateTime } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

export default async function AdminAccountPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        Oturum bulunamadı.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Hesabım</h1>
      <p className="mt-2 text-sm text-muted-strong">
        {admin.username} · {admin.role === 'owner' ? 'Sahip' : 'Editör'}
        {admin.lastLoginAt ? ` · son giriş ${formatDateTime(admin.lastLoginAt, 'medium')}` : ''}
      </p>

      <PasswordForm />

      <div className="mt-6">
        <TotpSettings enabled={admin.totpEnabled ?? false} />
      </div>
    </div>
  );
}

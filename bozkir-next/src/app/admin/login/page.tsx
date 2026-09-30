import { LoginForm } from '@/components/admin/LoginForm';
import { hasDb } from '@/lib/db/client';

export default function AdminLoginPage() {
  const configured = hasDb() && !!process.env.AUTH_SECRET;
  return (
    <main className="flex min-h-svh items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
        <p className="text-eyebrow">Yönetim</p>
        <h1 className="mt-4 text-2xl font-medium tracking-tight">Yönetim paneli girişi</h1>
        <p className="mt-3 text-sm text-muted-strong">Devam etmek için yetkili hesabınızla giriş yapın.</p>

        <div className="mt-8">
          {configured ? (
            <LoginForm />
          ) : (
            <p className="rounded-md border border-border bg-surface-2 p-4 text-sm text-muted-strong">
              Yapılandırma eksik. <code>DATABASE_URL</code> ve <code>AUTH_SECRET</code> ortam değişkenlerini
              tanımlayın; ardından admin hesabını oluşturun (<code>npm run seed:admin</code>).
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

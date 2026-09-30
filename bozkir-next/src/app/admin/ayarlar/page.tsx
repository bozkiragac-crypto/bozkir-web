import { getSession } from '@/lib/auth/session';
import { getSiteSettings } from '@/lib/data/settings';
import { getCategories } from '@/lib/api/categories';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (session?.role !== 'owner') {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Site ayarları</h1>
        <p className="mt-3 rounded-lg border border-border bg-surface p-5 text-sm text-muted-strong">
          Bu bölüm yalnızca sahip hesabına açıktır.
        </p>
      </div>
    );
  }

  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);

  return (
    <SettingsForm
      initial={settings}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
    />
  );
}

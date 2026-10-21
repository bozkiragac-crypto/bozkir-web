import { getSession } from '@/lib/auth/session';
import { getSiteSettingsFresh } from '@/lib/data/settings';
import { getDictionary } from '@/i18n/dictionaries';
import { TEXT_GROUPS, getTextByPath } from '@/i18n/overrides';
import { locales, type Locale } from '@/i18n/config';
import { SiteTextsEditor } from '@/components/admin/SiteTextsEditor';

export const dynamic = 'force-dynamic';

export default async function SiteTextsAdminPage() {
  const session = await getSession();
  if (session?.role !== 'owner') {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Site Metinleri</h1>
        <p className="mt-3 rounded-lg border border-border bg-surface p-5 text-sm text-muted-strong">
          Bu bölüm yalnızca sahip hesabına açıktır.
        </p>
      </div>
    );
  }

  const settings = await getSiteSettingsFresh();
  const dictionaries = {
    tr: getDictionary('tr'),
    en: getDictionary('en'),
    ar: getDictionary('ar'),
  };

  const defaults = { tr: {}, en: {}, ar: {} } as Record<Locale, Record<string, string>>;
  for (const locale of locales) {
    for (const group of TEXT_GROUPS) {
      for (const field of group.fields) {
        defaults[locale][field.path] = getTextByPath(dictionaries[locale], field.path);
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Site Metinleri</h1>
      <p className="mt-1 text-sm text-muted-strong">
        Ana sayfa ve sayfa başlıklarındaki metinleri TR/EN/AR olarak düzenleyin. Boş alanlar
        varsayılan metni kullanır.
      </p>
      <div className="mt-8">
        <SiteTextsEditor groups={TEXT_GROUPS} defaults={defaults} initial={settings.texts} />
      </div>
    </div>
  );
}

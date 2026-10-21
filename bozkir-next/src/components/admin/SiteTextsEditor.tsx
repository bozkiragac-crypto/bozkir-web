'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Save } from 'lucide-react';
import { saveSiteTexts } from '@/lib/admin/safe-actions';
import { useToast } from '@/components/ui/ToastProvider';
import type { Locale } from '@/i18n/config';
import type { SiteTexts, TextGroupDef } from '@/i18n/overrides';

const field =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-foreground';
const labelClass = 'text-xs tracking-[0.14em] text-muted uppercase';

export function SiteTextsEditor({
  groups,
  defaults,
  initial,
}: {
  groups: TextGroupDef[];
  defaults: Record<Locale, Record<string, string>>;
  initial: SiteTexts;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<SiteTexts>(initial);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(groups[0]?.id ?? null);

  function setValue(locale: Locale, path: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [locale]: { ...(prev[locale] ?? {}), [path]: value },
    }));
  }

  function reset(locale: Locale, path: string) {
    setValues((prev) => {
      const next = { ...(prev[locale] ?? {}) };
      delete next[path];
      return { ...prev, [locale]: next };
    });
  }

  async function save() {
    setBusy(true);
    const res = await saveSiteTexts(values);
    setBusy(false);
    if (!res.ok) {
      toast(res.error ?? 'Kaydedilemedi.');
      return;
    }
    toast('Site metinleri kaydedildi.');
    router.refresh();
  }

  const overrideCount = Object.values(values).reduce(
    (total, group) => total + Object.values(group ?? {}).filter(Boolean).length,
    0,
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5">
        <div>
          <p className="font-medium">Site metinleri</p>
          <p className="mt-1 text-sm text-muted-strong">
            Boş alanlar varsayılan sözlük metnini kullanır. {overrideCount} özel metin kayıtlı.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Tüm özel metinler silinsin ve varsayılanlar kullanılsın mı?')) {
                setValues({ tr: {}, en: {}, ar: {} });
              }
            }}
            disabled={busy}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> Varsayılana dön
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {busy ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {groups.map((group) => {
        const isOpen = open === group.id;
        return (
          <section key={group.id} className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : group.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 p-5 text-start"
            >
              <span>
                <span className="block font-medium">{group.title}</span>
                {group.hint && <span className="mt-1 block text-xs text-muted">{group.hint}</span>}
              </span>
              <span className="text-xs text-muted">{group.fields.length} alan</span>
            </button>

            {isOpen && (
              <div className="grid gap-5 border-t border-border p-5">
                {group.fields.map((fieldDef) => (
                  <div key={fieldDef.path} className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className={labelClass}>{fieldDef.label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          reset('tr', fieldDef.path);
                          reset('en', fieldDef.path);
                          reset('ar', fieldDef.path);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
                      >
                        <RotateCcw className="h-3 w-3" /> Varsayılana dön
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(['tr', 'en', 'ar'] as const).map((locale) => {
                        const value = values[locale]?.[fieldDef.path] ?? '';
                        const placeholder = defaults[locale]?.[fieldDef.path] ?? '';
                        const common = {
                          value,
                          maxLength: fieldDef.maxLength ?? 1200,
                          placeholder,
                          onChange: (
                            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                          ) => setValue(locale, fieldDef.path, e.target.value),
                          className: field,
                          dir: locale === 'ar' ? ('rtl' as const) : undefined,
                          'aria-label': `${fieldDef.label} (${locale.toUpperCase()})`,
                        };
                        return fieldDef.multiline ? (
                          <textarea key={locale} {...common} rows={2} />
                        ) : (
                          <input key={locale} {...common} />
                        );
                      })}
                    </div>
                    <p className="text-[0.68rem] text-muted">
                      TR: {defaults.tr?.[fieldDef.path] || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <div>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {busy ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}

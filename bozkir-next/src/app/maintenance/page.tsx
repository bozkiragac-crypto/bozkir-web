import { Phone, MessageCircle, Mail, Clock } from 'lucide-react';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { pickLocaleText } from '@/lib/locale-text';
import { dictFor } from '@/i18n/server';
import { resolveLocaleFromRequest } from '@/i18n/request';

/** MAINTENANCE_MODE=1 iken middleware tüm public trafiği buraya yönlendirir. */
export default async function MaintenancePage() {
  const locale = await resolveLocaleFromRequest();
  const dict = dictFor(locale);
  const m = dict.pages.maintenance;

  let s: Awaited<ReturnType<typeof getSiteSettings>> | null = null;
  try {
    s = await getSiteSettings();
  } catch {
    s = null;
  }

  const hours = s ? pickLocaleText(s.hours, locale, s.hoursEn, s.hoursAr) : '';
  const contacts = s
    ? [
        { icon: Phone, label: m.phone, value: s.phone, href: telHref(s.phone) },
        { icon: MessageCircle, label: m.whatsapp, value: m.whatsapp, href: s.whatsapp },
        { icon: Mail, label: m.email, value: s.email, href: `mailto:${s.email}` },
        ...(hours ? [{ icon: Clock, label: m.hours, value: hours, href: undefined }] : []),
      ]
    : [];

  return (
    <main className="grid min-h-svh place-items-center bg-background p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 text-center md:p-12">
        <p className="text-eyebrow">Bozkır Ağaç Ürünleri</p>
        <h1 className="text-headline mt-5">{m.title}</h1>
        <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-strong">{m.body}</p>

        {contacts.length > 0 && (
          <div className="mt-10 border-t border-border pt-8 text-start">
            <p className="text-eyebrow">{m.contactTitle}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {contacts.map((c) => {
                const Icon = c.icon;
                const inner = (
                  <>
                    <Icon className="h-4 w-4 flex-none text-muted-strong" />
                    <span className="min-w-0">
                      <span className="block text-[0.65rem] tracking-[0.14em] text-muted uppercase">{c.label}</span>
                      <span className="block truncate text-sm font-medium">{c.value}</span>
                    </span>
                  </>
                );
                return (
                  <li key={c.label}>
                    {c.href ? (
                      <a
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface-2"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

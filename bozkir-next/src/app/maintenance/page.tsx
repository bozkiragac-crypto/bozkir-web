import Link from 'next/link';
import { Phone, Clock, RefreshCw } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { getSiteSettings, telHref } from '@/lib/data/settings';
import { pickLocaleText } from '@/lib/locale-text';
import { dictForRequest } from '@/i18n/server';
import { resolveLocaleFromRequest } from '@/i18n/request';

/** MAINTENANCE_MODE=1 iken middleware tüm public trafiği buraya yönlendirir. */
export default async function MaintenancePage() {
  const locale = await resolveLocaleFromRequest();
  const dict = await dictForRequest(locale);
  const m = dict.pages.maintenance;

  let s: Awaited<ReturnType<typeof getSiteSettings>> | null = null;
  try {
    s = await getSiteSettings();
  } catch {
    s = null;
  }

  const phone = s?.phone ?? '';
  const whatsapp = s?.whatsapp ?? '';
  const email = s?.email ?? '';
  const hours = s ? pickLocaleText(s.hours, locale, s.hoursEn, s.hoursAr) : '';
  // Saat metnini '·' ayracından parçalara böl: tamamı görünsün, kesilmesin.
  const hoursParts = hours
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);

  const btn =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors';

  return (
    <main className="grid min-h-svh place-items-center bg-background p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 text-center md:p-12">
        <p className="text-eyebrow">Bozkır Ağaç Ürünleri</p>
        <h1 className="text-headline mt-5">{m.title}</h1>
        <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-strong">{m.body}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={`${btn} bg-foreground text-background hover:opacity-90`}>
            <RefreshCw className="h-4 w-4" />
            {m.retry}
          </Link>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} bg-[#25d366] text-white hover:brightness-95`}
            >
              <WhatsAppIcon className="h-4 w-4" />
              {m.whatsapp}
            </a>
          )}
          {phone && (
            <a
              href={telHref(phone)}
              className={`${btn} border border-border hover:bg-surface-2`}
            >
              <Phone className="h-4 w-4" />
              {phone}
            </a>
          )}
        </div>

        {(phone || email || whatsapp || hours) && (
          <div className="mt-10 border-t border-border pt-8">
            <p className="text-eyebrow">{m.contactLine}</p>
            <div className="mt-4 flex flex-col items-center gap-3 text-sm text-muted-strong">
              {(phone || email || whatsapp) && (
                <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                  {phone && (
                    <a
                      href={telHref(phone)}
                      className="text-foreground underline underline-offset-4 hover:text-accent"
                    >
                      {phone}
                    </a>
                  )}
                  {phone && (email || whatsapp) && <span aria-hidden>·</span>}
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="text-foreground underline underline-offset-4 hover:text-accent"
                    >
                      {email}
                    </a>
                  )}
                  {email && whatsapp && <span aria-hidden>·</span>}
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline underline-offset-4 hover:text-accent"
                    >
                      {m.whatsapp}
                    </a>
                  )}
                </p>
              )}
              {hours && (
                <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <Clock className="h-4 w-4 flex-none text-muted" />
                  <span>{hoursParts.join(' · ')}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <p className="mt-8 text-xs text-muted">{m.auto}</p>
      </div>
    </main>
  );
}

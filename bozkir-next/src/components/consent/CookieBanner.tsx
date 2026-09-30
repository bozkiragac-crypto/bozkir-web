'use client';

import { LocaleLink as Link } from '@/components/ui/LocaleLink';
import { useConsent } from './ConsentProvider';
import { useDictionary } from '@/i18n/DictionaryProvider';

/** KVKK/GDPR çerez onay bandı. Tercih yapılana kadar gösterilir. */
export function CookieBanner() {
  const { consent, ready, grant, deny } = useConsent();
  const { dict } = useDictionary();
  const c = dict.common;

  if (!ready || consent !== 'unset') return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={c.consentPolicy}
      className="fixed inset-x-0 bottom-0 z-[140] border-t border-border bg-background/95 px-4 py-4 backdrop-blur md:px-6"
      style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom,0px) + 1rem))' }}
    >
      <div className="container-x flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-strong">
          {c.consentText}{' '}
          <Link href="/cerez-politikasi" className="underline underline-offset-4 hover:text-foreground">
            {c.consentPolicy}
          </Link>
        </p>
        <div className="flex flex-none items-center gap-3">
          <button
            type="button"
            onClick={deny}
            className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            {c.consentDeny}
          </button>
          <button
            type="button"
            onClick={grant}
            className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.consentAccept}
          </button>
        </div>
      </div>
    </div>
  );
}

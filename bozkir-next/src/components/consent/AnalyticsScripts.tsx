'use client';

import Script from 'next/script';
import { useConsent } from './ConsentProvider';

/** Google Analytics yalnızca çerez onayı verildiyse yüklenir. */
export function AnalyticsScripts({ id }: { id: string }) {
  const { consent, ready } = useConsent();
  if (!ready || consent !== 'granted') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}

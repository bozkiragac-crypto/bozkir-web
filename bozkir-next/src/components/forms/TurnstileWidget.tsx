'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile widget'ı (explicit render).
 *
 * - `TURNSTILE_SITE_KEY` (sunucudan prop olarak) yoksa hiçbir şey render edilmez.
 * - Token tek kullanımlık; başarısız gönderimden sonra `resetSignal` artırılarak
 *   yeniden token alınır.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  resetSignal = 0,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !siteKey || !containerRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onToken(token),
      'expired-callback': () => onToken(''),
      'error-callback': () => onToken(''),
      theme: 'auto',
    });
  }, [ready, siteKey, onToken]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetId.current);
      } catch {
        // yok say
      }
      onToken('');
    }
    // resetSignal değişiminde çalışır
  }, [resetSignal, onToken]);

  useEffect(() => {
    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // yok say
        }
        widgetId.current = null;
      }
    };
  }, []);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={containerRef} />
    </>
  );
}

'use client';

import { useEffect } from 'react';

/**
 * PWA service worker kaydı. Yalnızca üretimde çalışır; geliştirme sunucusunda
 * önbellek/HMR çakışması yaratmaz.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Kayıt başarısız olsa da site normal çalışır.
      });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}

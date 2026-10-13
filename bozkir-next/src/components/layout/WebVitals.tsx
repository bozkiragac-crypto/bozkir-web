'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useConsent } from '@/components/consent/ConsentProvider';

/**
 * Core Web Vitals raporlaması. Üretimde yalnızca çerez onayı verildiyse GA'ya
 * gönderilir; geliştirmede konsola yazılır. (Ek bağımlılık yok.)
 */
export function WebVitals() {
  const { consent } = useConsent();

  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[web-vitals]', metric.name, Math.round(metric.value));
      return;
    }
    if (consent !== 'granted') return;
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    w.gtag?.('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.id,
      // CLS birimleri için ölçek (GA raporlaması).
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_name: metric.name,
      metric_value: metric.value,
      non_interaction: true,
    });
  });

  return null;
}

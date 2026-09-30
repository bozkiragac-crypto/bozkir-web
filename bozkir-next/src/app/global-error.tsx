'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Gerçek uygulamada merkezi hata izleme servisine gönderilir.
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.6 }}>
          Bir şeyler ters gitti
        </p>
        <h1 style={{ fontSize: '2.5rem', margin: '1.5rem 0 0' }}>İçerik yüklenemedi.</h1>
        <p style={{ margin: '1.5rem auto 0', maxWidth: '28rem', opacity: 0.7 }}>
          Bağlantı sorunu yaşanmış olabilir. Tekrar deneyebilir veya ana sayfaya dönebilirsiniz.
        </p>
        <div style={{ marginTop: '3rem' }}>
          <button
            onClick={reset}
            style={{
              border: 0,
              borderRadius: 999,
              background: '#111',
              color: '#fff',
              padding: '0.875rem 1.75rem',
              cursor: 'pointer',
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}

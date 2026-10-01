'use client';

/** Sayfa geçişlerinde hafif fade — GSAP yüklemeden CSS animasyonuyla. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}

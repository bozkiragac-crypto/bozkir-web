'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDictionary } from '@/i18n/DictionaryProvider';
import type { PanelFinish } from './PanelViewer';

// WebGL sahnesi yalnızca görünür alana girince indirilir (code-split + lazy).
const PanelViewer = dynamic(() => import('./PanelViewer').then((m) => m.PanelViewer), {
  ssr: false,
  loading: () => <PanelFallback />,
});

/** NOT: Bu yüzeyler temsili bitiş görünümleridir; gerçek ürün rengi değildir. */
const finishDefs: Omit<PanelFinish, 'label'>[] = [
  { id: 'mdf', color: '#d9cdb4', roughness: 0.85, metalness: 0.02 },
  { id: 'lak', color: '#cfd6d8', roughness: 0.12, metalness: 0.06 },
  { id: 'suntalam', color: '#c8b291', roughness: 0.7, metalness: 0.03 },
  { id: 'sunta', color: '#b9a98c', roughness: 0.95, metalness: 0.0 },
];

function PanelFallback({ alt = '' }: { alt?: string }) {
  return (
    <div className="relative h-full w-full">
      <Image src="/images/materials/mdf.webp" alt={alt} fill sizes="50vw" className="object-cover" />
    </div>
  );
}

export function Panel3D() {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const { dict } = useDictionary();
  const h = dict.home.material3d;
  const finishes: PanelFinish[] = finishDefs.map((f, i) => ({ ...f, label: h.finishes[i] ?? f.id }));
  const hostRef = useRef<HTMLDivElement>(null);
  const [seeded, setSeeded] = useState(false);
  const [inView, setInView] = useState(false);
  const [finish, setFinish] = useState(finishes[0]!);

  // WebGL yalnızca ekrana girince başlar; ekrandan çıkınca render durur.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = !!entry?.isIntersecting;
        setInView(visible);
        if (visible) setSeeded(true);
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div ref={hostRef} className="relative min-h-0 flex-1">
        {reduced || !seeded ? (
          <PanelFallback alt={h.imageAlt} />
        ) : (
          <PanelViewer finish={finish} active={inView} dprMax={isMobile ? 1.25 : 1.75} />
        )}
        <span className="pointer-events-none absolute bottom-4 left-5 flex items-center gap-2 text-[0.65rem] tracking-[0.14em] text-muted uppercase">
          <RotateCcw className="h-3.5 w-3.5" /> {h.hint}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
        {finishes.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFinish(f)}
            aria-pressed={finish.id === f.id}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              finish.id === f.id
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-strong hover:border-border-strong hover:text-foreground',
            )}
          >
            <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: f.color }} />
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[0.65rem] text-muted">{h.layers}</span>
      </div>
    </div>
  );
}

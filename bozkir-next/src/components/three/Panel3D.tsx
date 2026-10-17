'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useDictionary } from '@/i18n/DictionaryProvider';
import { Dropdown } from '@/components/ui/Dropdown';
import type { PanelFinish } from './PanelViewer';

// WebGL sahnesi yalnızca görünür alana girince indirilir (code-split + lazy).
const PanelViewer = dynamic(() => import('./PanelViewer').then((m) => m.PanelViewer), {
  ssr: false,
  loading: () => <PanelFallback />,
});

// AR katmanı yalnızca kullanıcı istediğinde yüklenir (SSR kapalı).
const PanelAR = dynamic(() => import('./PanelAR').then((m) => m.PanelAR), { ssr: false });

/** NOT: Bu yüzeyler temsili bitiş görünümleridir; gerçek ürün rengi değildir. */
const finishDefs: Omit<PanelFinish, 'label'>[] = [
  {
    id: 'mdf',
    color: '#d9cdb4',
    roughness: 0.85,
    metalness: 0.02,
    core: 'mdf',
    surface: 'melamin',
  },
  {
    id: 'lak',
    color: '#cfd6d8',
    roughness: 0.12,
    metalness: 0.06,
    core: 'mdf',
    surface: 'melamin',
  },
  {
    id: 'suntalam',
    color: '#c8b291',
    roughness: 0.7,
    metalness: 0.03,
    core: 'particle',
    surface: 'melamin',
  },
  {
    id: 'sunta',
    color: '#b9a98c',
    roughness: 0.95,
    metalness: 0.0,
    core: 'particle',
    surface: 'raw',
  },
];

const MDF_CORE_COLOR = '#cfbfa2';
const CHIP_CORE_COLOR = '#b3946a';

function PanelFallback({ alt = '' }: { alt?: string }) {
  return (
    <div className="relative h-full w-full">
      <Image
        src="/images/materials/mdf.webp"
        alt={alt}
        fill
        sizes="50vw"
        className="object-cover"
      />
    </div>
  );
}

export function Panel3D() {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const { dict } = useDictionary();
  const h = dict.home.material3d;
  const finishes: PanelFinish[] = finishDefs.map((f, i) => ({
    ...f,
    label: h.finishes[i] ?? f.id,
  }));
  const hostRef = useRef<HTMLDivElement>(null);
  const [seeded, setSeeded] = useState(false);
  const [inView, setInView] = useState(false);
  const [finish, setFinish] = useState(finishes[0]!);
  const [resetSignal, setResetSignal] = useState(0);

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

  const layerWords = h.layers
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const coreLabel = finish.core === 'particle' ? h.coreParticle : h.coreMdf;
  const legend = [layerWords[0] ?? '', coreLabel, layerWords[2] ?? layerWords[0] ?? ''];
  const legendColors = [
    finish.color,
    finish.core === 'particle' ? CHIP_CORE_COLOR : MDF_CORE_COLOR,
    finish.color,
  ];

  return (
    <div className="flex h-full w-full flex-col">
      <div ref={hostRef} className="relative min-h-0 flex-1">
        {reduced || !seeded ? (
          <PanelFallback alt={h.imageAlt} />
        ) : (
          <PanelViewer
            finish={finish}
            active={inView}
            resetSignal={resetSignal}
            dprMax={isMobile ? 1.25 : 1.5}
          />
        )}
        <span
          title={h.hint}
          className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-[0.65rem] tracking-[0.14em] text-muted uppercase backdrop-blur"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{h.hint}</span>
        </span>
      </div>

      <div className="border-t border-border p-4">
        {/* Mobil: bitiş seçimi tek dropdown */}
        <div className="sm:hidden">
          <span className="text-[0.65rem] tracking-[0.14em] text-muted uppercase">
            {h.finishLabel}
          </span>
          <Dropdown
            className="mt-2 w-full"
            ariaLabel={h.finishLabel}
            align="start"
            triggerClassName="bg-surface"
            value={finish.id}
            onChange={(v) => {
              const f = finishes.find((x) => x.id === v);
              if (f) setFinish(f);
            }}
            options={finishes.map((f) => ({ value: f.id, label: f.label, dot: f.color }))}
          />
        </div>

        {/* Kontroller: mobilde ikon-only */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:mt-0">
          <span className="hidden text-[0.65rem] tracking-[0.14em] text-muted uppercase sm:inline">
            {h.finishLabel}
          </span>
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2 sm:flex-none sm:justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResetSignal((n) => n + 1)}
                aria-label={h.resetView}
                title={h.resetView}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-strong transition-colors hover:border-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{h.resetView}</span>
              </button>
              <PanelAR color={finish.color} />
            </div>
          </div>
        </div>

        {/* Masaüstü: bitiş çipleri */}
        <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
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
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: f.color }}
              />
              {f.label}
            </button>
          ))}
        </div>

        {/* Masaüstü: katman lejantı */}
        <ul className="mt-3 hidden flex-wrap items-center gap-x-4 gap-y-1 text-[0.65rem] text-muted sm:flex">
          {legend.map((layer, i) => (
            <li key={`${layer}-${i}`} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full border border-black/10"
                style={{ backgroundColor: legendColors[i] ?? finish.color }}
                aria-hidden
              />
              {layer}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, XROrigin, useXRHitTest, createXRStore } from '@react-three/xr';
import { RoundedBox } from '@react-three/drei';
import { Scan, X } from 'lucide-react';
import * as THREE from 'three';
import { useDictionary } from '@/i18n/DictionaryProvider';

// `hitTest` oturum özelliği mutlaka istenmeli; aksi halde yüzeye oturtma çalışmaz.
const store = createXRStore({ hitTest: true });

/** Yüzeye oturtulan panel (hit-test ile konumlanır, zemine yatık). */
function PlacedPanel({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useXRHitTest(
    (results, getWorldMatrix) => {
      const group = ref.current;
      if (!group) return;
      if (results.length === 0) {
        group.visible = false;
        return;
      }
      if (getWorldMatrix(matrix, results[0]!)) {
        matrix.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
        group.visible = true;
        group.position.copy(pos);
        group.rotation.set(-Math.PI / 2, 0, 0);
      }
    },
    'viewer',
    ['plane', 'mesh', 'point'],
  );

  return (
    <group ref={ref} visible={false}>
      <RoundedBox args={[1, 0.66, 0.04]} radius={0.01} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.05} />
      </RoundedBox>
    </group>
  );
}

function ARSession({
  color,
  error,
  onStart,
}: {
  color: string;
  error: string | null;
  onStart: () => void;
}) {
  const { t } = useDictionary();
  return (
    <div className="relative h-full w-full">
      <Canvas gl={{ alpha: true, antialias: true }} frameloop="always" dpr={[1, 1.5]}>
        <XR store={store}>
          <XROrigin />
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 4, 2]} intensity={1.4} />
          <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#b3a98f" />
          <PlacedPanel color={color} />
        </XR>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 px-6">
        <button
          type="button"
          onClick={onStart}
          className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-black"
        >
          <Scan className="h-4 w-4" /> {t('product.arStart')}
        </button>
        {error && <p className="max-w-xs text-center text-xs text-white/80">{error}</p>}
      </div>
    </div>
  );
}

/** Destekleyen (HTTPS + AR) cihazlarda "AR'da gör" — paneli yüzeye oturtur. */
export function PanelAR({ color = '#d9cdb4' }: { color?: string }) {
  const { t } = useDictionary();
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const xr = (
      navigator as Navigator & { xr?: { isSessionSupported?: (m: string) => Promise<boolean> } }
    ).xr;
    xr?.isSessionSupported?.('immersive-ar')
      .then((ok) => setSupported(!!ok))
      .catch(() => {});
  }, []);

  const startAR = async () => {
    setError(null);
    try {
      // Yalnızca kullanıcı jestiyle çağrılır (tarayıcı şartı).
      const session = await store.enterAR();
      if (!session) setError(t('product.arError'));
    } catch {
      setError(t('product.arError'));
    }
  };

  if (!supported) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActive(true);
          void startAR();
        }}
        aria-label={t('product.viewAR')}
        title={t('product.viewAR')}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2"
      >
        <Scan className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">{t('product.viewAR')}</span>
      </button>

      {active && (
        <div className="fixed inset-0 z-[250] bg-black/95">
          <button
            type="button"
            onClick={() => setActive(false)}
            aria-label={t('home.gallery.close')}
            className="absolute end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <ARSession color={color} error={error} onStart={startAR} />
        </div>
      )}
    </>
  );
}

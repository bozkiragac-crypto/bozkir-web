'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Edges,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from '@react-three/drei';
import * as THREE from 'three';

export type PanelCore = 'mdf' | 'particle';
export type PanelSurface = 'melamin' | 'raw';

export interface PanelFinish {
  id: string;
  label: string;
  color: string;
  roughness: number;
  metalness: number;
  /** İç malzeme (kesitte görünür). */
  core: PanelCore;
  /** Yüzey tipi: kaplamalı (melamin) ya da ham (sunta). */
  surface: PanelSurface;
}

export type PanelView = 'section' | 'surface';

interface PanelViewerProps {
  finish: PanelFinish;
  /** Görünür değilken render döngüsünü durdurur (performans). */
  active?: boolean;
  /** Otomatik döndürme açık mı. */
  autoRotate?: boolean;
  /** Dışarıdan artırıldığında kamerayı başlangıca döndürür. */
  resetSignal?: number;
  /** Kamera ön ayarı: kesit (açılı) veya yüzey (cepheden). */
  view?: PanelView;
  /** Cihaz başına piksel oranı üst sınırı (mobilde düşürülür). */
  dprMax?: number;
}

const WIDTH = 3;
const HEIGHT = 1.95;
const THICKNESS = 0.16;
const SURFACE_T = 0.022;
const EDGE_COLOR = '#3a2f22';

/** Kamera ve model yönelimi: kesit (yandan açılı) vs yüzey (tam cephe). */
const VIEW_CAM: Record<PanelView, [number, number, number]> = {
  section: [-3.15, 0.85, 3.1],
  surface: [0, 0.05, 3.9],
};
const VIEW_ROT: Record<PanelView, [number, number, number]> = {
  section: [-0.05, -0.62, 0],
  surface: [0, 0, 0],
};
const ZERO = new THREE.Vector3(0, 0, 0);

/** Prosedürel doku (dosyasız): renk ve mikro pürüzlülük haritası. */
function makeTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  srgb: boolean,
) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** MDF öz: homojen, yönsüz lif yapısı (ince benek + hafif lif kırıntıları). */
function drawFiberCore(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#cfbfa2';
  ctx.fillRect(0, 0, size, size);
  const dots = Math.round(size * size * 0.5);
  for (let i = 0; i < dots; i++) {
    const v = 196 + Math.round(Math.random() * 34);
    ctx.fillStyle = `rgba(${v},${v - 8},${v - 22},0.5)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  for (let i = 0; i < size * 0.6; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 2 + Math.random() * 4;
    const a = Math.random() * Math.PI;
    ctx.strokeStyle = `rgba(150,128,96,${0.05 + Math.random() * 0.07})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
}

/** Yonga levha öz: rastgele iri/uzun yonga pulları (sunta/suntalam içi). */
function drawChipCore(ctx: CanvasRenderingContext2D, size: number, contrast = 1) {
  ctx.fillStyle = '#b3946a';
  ctx.fillRect(0, 0, size, size);
  const palette = ['#8a6a44', '#a9855a', '#6f5636', '#8f7250', '#c2a97f', '#5f4a2e', '#9c7b52'];
  const chips = Math.round(size * 4.5);
  for (let i = 0; i < chips; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 7 + Math.random() * 13;
    const h = 2 + Math.random() * 3;
    const a = Math.random() * Math.PI;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.globalAlpha = (0.45 + Math.random() * 0.45) * contrast;
    ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)]!;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** Ham sunta yüzeyi: daha büyük, düşük kontrastlı yonga dokusu. */
function drawChipSurface(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#c6ac83';
  ctx.fillRect(0, 0, size, size);
  const palette = ['#a9855a', '#b89768', '#8f7250', '#c2a97f', '#9c7b52'];
  const chips = Math.round(size * 3);
  for (let i = 0; i < chips; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 12 + Math.random() * 20;
    const h = 3 + Math.random() * 5;
    const a = Math.random() * Math.PI;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.globalAlpha = 0.3 + Math.random() * 0.35;
    ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)]!;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawMicro(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);
  const dots = size * size * 0.35;
  for (let i = 0; i < dots; i++) {
    const v = 118 + Math.round(Math.random() * 24);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
}

interface PanelResources {
  surfaceSmooth: THREE.MeshStandardMaterial;
  surfaceRaw: THREE.MeshStandardMaterial;
  coreMdf: THREE.MeshStandardMaterial;
  coreParticle: THREE.MeshStandardMaterial;
  disposable: { dispose: () => void }[];
}

function usePanelResources(): PanelResources {
  const resources = useRef<PanelResources | null>(null);

  if (!resources.current) {
    const fiberMap = makeTexture(256, drawFiberCore, true);
    const chipMap = makeTexture(256, drawChipCore, true);
    chipMap.repeat.set(3, 2);
    const chipSurfaceMap = makeTexture(256, drawChipSurface, true);
    chipSurfaceMap.repeat.set(2, 2);
    const microMap = makeTexture(192, drawMicro, false);
    microMap.repeat.set(5, 5);

    resources.current = {
      surfaceSmooth: new THREE.MeshStandardMaterial({
        roughnessMap: microMap,
        envMapIntensity: 1.1,
      }),
      surfaceRaw: new THREE.MeshStandardMaterial({
        map: chipSurfaceMap,
        roughness: 0.95,
        metalness: 0,
        envMapIntensity: 0.5,
      }),
      coreMdf: new THREE.MeshStandardMaterial({ map: fiberMap, roughness: 0.9, metalness: 0 }),
      coreParticle: new THREE.MeshStandardMaterial({ map: chipMap, roughness: 0.95, metalness: 0 }),
      disposable: [microMap, fiberMap, chipMap, chipSurfaceMap],
    };
  }

  const res = resources.current!;

  useEffect(() => {
    return () => {
      res.surfaceSmooth.dispose();
      res.surfaceRaw.dispose();
      res.coreMdf.dispose();
      res.coreParticle.dispose();
      for (const d of res.disposable) d.dispose();
    };
  }, [res]);

  return res;
}

/** Katmanlı panel: kaplama + öz + kaplama. Öz/yüzey ve yönelim bitiş/görünüme göre değişir. */
function PanelModel({ finish, view }: { finish: PanelFinish; view: PanelView }) {
  const { surfaceSmooth, surfaceRaw, coreMdf, coreParticle } = usePanelResources();
  const targetColor = useMemo(() => new THREE.Color(finish.color), [finish.color]);
  const group = useRef<THREE.Group>(null);

  const surface = finish.surface === 'raw' ? surfaceRaw : surfaceSmooth;
  const core = finish.core === 'particle' ? coreParticle : coreMdf;

  useFrame((state) => {
    if (finish.surface !== 'raw') {
      surfaceSmooth.color.lerp(targetColor, 0.12);
      surfaceSmooth.roughness = THREE.MathUtils.lerp(
        surfaceSmooth.roughness,
        finish.roughness,
        0.12,
      );
      surfaceSmooth.metalness = THREE.MathUtils.lerp(
        surfaceSmooth.metalness,
        finish.metalness,
        0.12,
      );
      surfaceSmooth.envMapIntensity = THREE.MathUtils.lerp(
        surfaceSmooth.envMapIntensity,
        finish.roughness > 0.5 ? 0.75 : 1.5,
        0.1,
      );
    }
    if (group.current) {
      const t = state.clock.elapsedTime;
      const rot = VIEW_ROT[view];
      const g = group.current;
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, rot[0], 0.1) + Math.sin(t * 0.4) * 0.004;
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, rot[1], 0.1);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, rot[2], 0.1) + Math.sin(t * 0.4) * 0.01;
      g.position.y = Math.sin(t * 0.7) * 0.02;
    }
  });

  const surfaceZ = THICKNESS / 2 - SURFACE_T / 2;
  const coreDepth = THICKNESS - SURFACE_T * 2;

  return (
    <group ref={group} rotation={VIEW_ROT.section}>
      <RoundedBox
        args={[WIDTH, HEIGHT, SURFACE_T]}
        radius={0.008}
        smoothness={2}
        position={[0, 0, surfaceZ]}
        material={surface}
      >
        <Edges color={EDGE_COLOR} threshold={40} />
      </RoundedBox>
      <RoundedBox
        args={[WIDTH, HEIGHT, SURFACE_T]}
        radius={0.008}
        smoothness={2}
        position={[0, 0, -surfaceZ]}
        material={surface}
      >
        <Edges color={EDGE_COLOR} threshold={40} />
      </RoundedBox>
      <RoundedBox
        args={[WIDTH - 0.004, HEIGHT - 0.004, coreDepth]}
        radius={0.005}
        smoothness={2}
        material={core}
      >
        <Edges color={EDGE_COLOR} threshold={40} />
      </RoundedBox>
    </group>
  );
}

/** Kamera ön ayarı: görünüme göre hedefe yumuşak geçiş + sıfırlama. */
function CameraRig({ view, signal }: { view: PanelView; signal: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  const target = useRef(new THREE.Vector3(...VIEW_CAM[view]));

  useEffect(() => {
    target.current.set(...VIEW_CAM[view]);
  }, [view, signal]);

  useFrame(() => {
    if (camera.position.distanceToSquared(target.current) > 1e-4) {
      camera.position.lerp(target.current, 0.12);
      if (controls) {
        controls.target.lerp(ZERO, 0.12);
        controls.update();
      }
    }
  });

  return null;
}

/**
 * Premium 3D panel kesiti: katmanlı model (bitişe göre öz/yüzey), studyo
 * yansımaları, damping'li döndürme, sınırlı zoom, kamera ön ayarı ve etiket.
 */
export function PanelViewer({
  finish,
  active = true,
  autoRotate = true,
  resetSignal = 0,
  view = 'section',
  dprMax = 1.75,
}: PanelViewerProps) {
  const [localReset, setLocalReset] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sahne üzerinde tekerlek/pinch sayfayı kaydırmasın (Lenis + native scroll engellenir).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const blockWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', blockWheel, { passive: false });
    return () => el.removeEventListener('wheel', blockWheel);
  }, []);

  return (
    <div
      ref={wrapRef}
      data-lenis-prevent
      className="h-full w-full overscroll-contain"
      style={{ touchAction: 'none' }}
      onDoubleClick={() => setLocalReset((n) => n + 1)}
    >
      <Canvas
        dpr={[1, dprMax]}
        frameloop={active ? 'always' : 'never'}
        camera={{ position: VIEW_CAM.section, fov: 32 }}
        performance={{ min: 0.6 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.45} color="#b3a98f" />

        <PanelModel finish={finish} view={view} />

        <ContactShadows
          position={[0, -1.35, 0]}
          opacity={0.4}
          scale={8}
          blur={2.6}
          far={3.5}
          resolution={256}
          color="#000000"
        />

        {/* Dosyasız studyo ortamı: yansımalar. */}
        <Environment resolution={64}>
          <Lightformer form="rect" intensity={2.4} position={[0, 3.2, 2.4]} scale={[7, 3, 1]} />
          <Lightformer
            form="rect"
            intensity={1.1}
            position={[-3.4, 0.8, -2.2]}
            scale={[4, 4, 1]}
            color="#ffe9d2"
          />
          <Lightformer
            form="rect"
            intensity={0.8}
            position={[3.4, -1, 1.6]}
            scale={[4, 3, 1]}
            color="#dfe8ff"
          />
        </Environment>

        <Html
          position={[0, -HEIGHT / 2 - 0.32, 0]}
          center
          className="pointer-events-none select-none"
          zIndexRange={[10, 0]}
        >
          <span className="whitespace-nowrap rounded-full border border-border bg-background/85 px-2.5 py-1 text-[0.6rem] font-medium tracking-[0.08em] text-foreground uppercase backdrop-blur">
            {finish.label}
          </span>
        </Html>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={2.6}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 3.4}
          maxPolarAngle={Math.PI / 1.75}
          autoRotate={autoRotate && view === 'section'}
          autoRotateSpeed={0.6}
          rotateSpeed={0.55}
          zoomSpeed={0.6}
        />

        <CameraRig view={view} signal={localReset + resetSignal} />
      </Canvas>
    </div>
  );
}

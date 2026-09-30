'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export interface PanelFinish {
  id: string;
  label: string;
  color: string;
  roughness: number;
  metalness: number;
}

interface PanelViewerProps {
  finish: PanelFinish;
  /** Görünür değilken render döngüsünü durdurur (performans). */
  active?: boolean;
  /** Cihaz başına piksel oranı üst sınırı (mobilde düşürülür). */
  dprMax?: number;
}

const CAMERA_POS: [number, number, number] = [0, 0.25, 5.2];
const WIDTH = 3;
const HEIGHT = 1.95;
const THICKNESS = 0.16;
const SURFACE = 0.022;

/** Prosedürel doku (dosyasız): renk ve mikro pürüzlülük haritası. */
function makeTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, srgb: boolean) {
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

function drawWood(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillStyle = '#c7b28d';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 5) {
    ctx.strokeStyle = `rgba(122,92,60,${0.05 + Math.random() * 0.09})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    for (let x = 0; x <= size; x += 12) {
      const yy = y + Math.sin(x * 0.07 + y * 0.15) * 2.2;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = `rgba(80,58,36,${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
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
  surface: THREE.MeshStandardMaterial;
  core: THREE.MeshStandardMaterial;
  coreMap: THREE.CanvasTexture;
  microMap: THREE.CanvasTexture;
}

function usePanelResources(): PanelResources {
  const resources = useRef<PanelResources | null>(null);

  if (!resources.current) {
    const coreMap = makeTexture(256, drawWood, true);
    const microMap = makeTexture(192, drawMicro, false);
    microMap.repeat.set(5, 5);
    resources.current = {
      surface: new THREE.MeshStandardMaterial({ roughnessMap: microMap, envMapIntensity: 1.1 }),
      core: new THREE.MeshStandardMaterial({ color: '#c7b28d', map: coreMap, roughness: 0.95, metalness: 0 }),
      coreMap,
      microMap,
    };
  }

  const res = resources.current!;

  useEffect(() => {
    return () => {
      res.surface.dispose();
      res.core.dispose();
      res.coreMap.dispose();
      res.microMap.dispose();
    };
  }, [res]);

  return res;
}

/** Katmanlı panel: melamin yüzey + MDF öz + melamin yüzey. Bitişler yumuşak geçer. */
function PanelModel({ finish }: { finish: PanelFinish }) {
  const { surface, core } = usePanelResources();
  const targetColor = useMemo(() => new THREE.Color(finish.color), [finish.color]);

  useFrame(() => {
    surface.color.lerp(targetColor, 0.12);
    surface.roughness = THREE.MathUtils.lerp(surface.roughness, finish.roughness, 0.12);
    surface.metalness = THREE.MathUtils.lerp(surface.metalness, finish.metalness, 0.12);
    surface.envMapIntensity = THREE.MathUtils.lerp(surface.envMapIntensity, finish.roughness > 0.5 ? 0.75 : 1.5, 0.1);
  });

  const surfaceZ = THICKNESS / 2 - SURFACE / 2;
  const coreDepth = THICKNESS - SURFACE * 2;

  return (
    <group rotation={[0.05, -0.5, 0]}>
      <RoundedBox args={[WIDTH, HEIGHT, SURFACE]} radius={0.008} smoothness={2} position={[0, 0, surfaceZ]} material={surface} />
      <RoundedBox args={[WIDTH, HEIGHT, SURFACE]} radius={0.008} smoothness={2} position={[0, 0, -surfaceZ]} material={surface} />
      <RoundedBox args={[WIDTH - 0.004, HEIGHT - 0.004, coreDepth]} radius={0.005} smoothness={2} material={core} />
    </group>
  );
}

/** Çift tıklamada kamerayı başlangıç konumuna döndürür. */
function ResetOnSignal({ signal }: { signal: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;

  useEffect(() => {
    camera.position.set(...CAMERA_POS);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [signal, camera, controls]);

  return null;
}

/**
 * Premium 3D panel kesiti: katmanlı model, studyo yansımaları (Lightformer),
 * damping'li döndürme, sınırlı zoom ve çift tıkla sıfırlama.
 */
export function PanelViewer({ finish, active = true, dprMax = 1.75 }: PanelViewerProps) {
  const [reset, setReset] = useState(0);
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
      onDoubleClick={() => setReset((n) => n + 1)}
    >
      <Canvas
        dpr={[1, dprMax]}
        frameloop={active ? 'always' : 'never'}
        camera={{ position: CAMERA_POS, fov: 32 }}
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

        <PanelModel finish={finish} />

        <ContactShadows position={[0, -1.35, 0]} opacity={0.4} scale={8} blur={2.6} far={3.5} color="#000000" />

        {/* Dosyasız studyo ortamı: lake yüzeylerde gerçekçi yansıma verir. */}
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={2.4} position={[0, 3.2, 2.4]} scale={[7, 3, 1]} />
          <Lightformer form="rect" intensity={1.1} position={[-3.4, 0.8, -2.2]} scale={[4, 4, 1]} color="#ffe9d2" />
          <Lightformer form="rect" intensity={0.8} position={[3.4, -1, 1.6]} scale={[4, 3, 1]} color="#dfe8ff" />
        </Environment>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={3}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 3.1}
          maxPolarAngle={Math.PI / 1.7}
          autoRotate
          autoRotateSpeed={0.6}
          rotateSpeed={0.55}
          zoomSpeed={0.6}
        />

        <ResetOnSignal signal={reset} />
      </Canvas>
    </div>
  );
}

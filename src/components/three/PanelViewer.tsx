'use client';

import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';

export interface PanelFinish {
  id: string;
  label: string;
  color: string;
  roughness: number;
  metalness: number;
}

interface PanelViewerProps {
  finish: PanelFinish;
}

/**
 * Hafif 3D panel: düşük poligon, düz renk malzeme.
 * Sürükleyerek döndürülür; boşta yavaşça kendi etrafında döner.
 */
export function PanelViewer({ finish }: PanelViewerProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.2, 4.6], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={2.1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#b3a98f" />

      <RoundedBox args={[3, 1.95, 0.14]} radius={0.025} smoothness={4} castShadow>
        <meshStandardMaterial color={finish.color} roughness={finish.roughness} metalness={finish.metalness} />
      </RoundedBox>

      <ContactShadows position={[0, -1.25, 0]} opacity={0.35} scale={7} blur={2.4} far={3} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.75}
        autoRotate
        autoRotateSpeed={0.7}
        rotateSpeed={0.6}
      />
    </Canvas>
  );
}

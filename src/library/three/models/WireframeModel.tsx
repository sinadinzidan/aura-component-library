import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { DoubleSide } from 'three';
import type { MeshBasicMaterial } from 'three';

import { toTuple } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

import type { WireframePart } from './scanSweep';

export type WireframeModelProps = {
  parts: readonly WireframePart[];
  /** Resolved colour per part id. Parts without one take the accent. */
  colors?: Readonly<Record<string, string>>;
  /** Parts drawn brighter, e.g. the ones a scan plane is passing. */
  activeIds?: readonly string[];
  /** The part with a fault: thicker lines and a breathing glow. Holds still under reduced motion. */
  faultId?: string | null;
};

function FaultGlow({ part, color }: { part: WireframePart; color: string }) {
  const { reducedMotion } = useSceneEnvironment();
  const material = useRef<MeshBasicMaterial>(null);
  const radius = Math.max(part.radius ?? 0, part.radiusTop ?? 0, (part.width ?? 0) / 2) * 1.35;

  useFrame((state) => {
    if (reducedMotion || !material.current) return;
    material.current.opacity = 0.14 + 0.12 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3));
    state.invalidate();
  });

  return (
    <mesh position={toTuple(part.center)}>
      <cylinderGeometry args={[radius, radius, part.height * 1.3, 20, 1, true]} />
      <meshBasicMaterial ref={material} color={color} transparent opacity={0.2} side={DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/**
 * A machine as a hologram: every part is a translucent solid with its edges drawn as bright
 * lines, so you see through the casing to what is inside. Colour comes in per part, which is how
 * a thermal or vibration map is painted onto it; the faulted part glows.
 */
export function WireframeModel({ parts, colors = {}, activeIds = [], faultId = null }: WireframeModelProps) {
  const { palette } = useSceneEnvironment();

  return (
    <group>
      {parts.map((part) => {
        const color = colors[part.id] ?? palette.accent.color;
        const active = activeIds.includes(part.id);
        const fault = part.id === faultId;
        return (
          <group key={part.id}>
            <mesh position={toTuple(part.center)}>
              {part.shape === 'box' ? (
                <boxGeometry args={[part.width ?? 1, part.height, part.depth ?? 1]} />
              ) : (
                <cylinderGeometry args={[part.radiusTop ?? part.radius ?? 1, part.radius ?? 1, part.height, part.segments ?? 16]} />
              )}
              <meshBasicMaterial color={color} transparent opacity={fault ? 0.22 : active ? 0.16 : 0.05} side={DoubleSide} depthWrite={false} />
              <Edges threshold={20} color={color} lineWidth={fault ? 2.4 : active ? 2 : 1.1} transparent opacity={active || fault ? 1 : 0.75} />
            </mesh>
            {fault ? <FaultGlow part={part} color={color} /> : null}
          </group>
        );
      })}
    </group>
  );
}

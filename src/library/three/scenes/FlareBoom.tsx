import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { LatticeFrame } from './LatticeFrame';
import { boomMembers } from './latticeGeometry';

export type FlareBoomProps = {
  /** The heel, where the boom is pinned to the deck edge. */
  position?: Vec3;
  /** Turns the boom around the vertical axis. 0 points east (+x). */
  rotationY?: number;
  length?: number;
  /** Angle above the horizontal, in radians. */
  elevation?: number;
  lit?: boolean;
  dimmed?: boolean;
};

/**
 * A flare boom cantilevered out from a deck: a triangular lattice carrying the flare line to a tip
 * well clear of the platform, with a flame that flickers gently and holds still under reduced motion.
 */
export function FlareBoom({ position = [0, 0, 0], rotationY = 0, length = 26, elevation = 0.5, lit = true, dimmed = false }: FlareBoomProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const { frame, pipe, steel } = useEquipmentMaterials({ dimmed });
  const flame = useRef<Group>(null);
  const members = useMemo(() => boomMembers({ length, width: 2.6, tipWidth: 0.8, bays: Math.max(3, Math.round(length / 4)) }), [length]);
  const line = useMemo(() => ({ from: [0, 0.5, 0] as const, to: [length, 0.3, 0] as const }), [length]);
  const tip: Vec3 = [Math.cos(elevation) * length, Math.sin(elevation) * length, 0];
  const animate = lit && !reducedMotion && !dimmed;

  useFrame((state) => {
    if (!animate || !flame.current) return;
    const time = state.clock.elapsedTime;
    flame.current.scale.set(1 + Math.sin(time * 6.3) * 0.05, 1 + Math.sin(time * 5.1) * 0.08 + Math.sin(time * 8.7) * 0.05, 1 + Math.cos(time * 4.4) * 0.05);
    state.invalidate();
  });

  return (
    <group position={toTuple(position)} rotation={[0, rotationY, 0]}>
      <group rotation={[0, 0, elevation]}>
        <LatticeFrame members={members} material={frame} legRadius={0.14} braceRadius={0.07} />
        <Strut from={line.from} to={line.to} radius={0.16} material={pipe} />
      </group>
      <group position={toTuple(tip)}>
        <mesh position={[0, 0.9, 0]} material={steel}>
          <cylinderGeometry args={[0.45, 0.3, 1.8, 12]} />
        </mesh>
        {lit ? (
          <group ref={flame} position={[0, 1.8, 0]}>
            <mesh position={[0, 1.7, 0]}>
              <coneGeometry args={[0.8, 3.4, 12]} />
              <meshBasicMaterial color={palette.flame.color} transparent opacity={(dimmed ? 0.25 : 0.85) * palette.flame.opacity} depthWrite={false} />
            </mesh>
            <mesh position={[0, 1, 0]}>
              <coneGeometry args={[0.42, 2, 10]} />
              <meshBasicMaterial color={palette.warning.color} transparent opacity={dimmed ? 0.2 : 0.9} depthWrite={false} />
            </mesh>
          </group>
        ) : null}
      </group>
    </group>
  );
}

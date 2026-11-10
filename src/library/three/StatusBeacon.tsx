import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';

import { useSceneEnvironment } from './sceneEnvironment';
import type { SceneTone } from './scenePalette';

export type StatusBeaconProps = {
  tone: SceneTone;
  /** Outer radius of the ring, in scene units. */
  radius?: number;
  /** Slow breathing pulse. Ignored under reduced motion. */
  pulse?: boolean;
  dimmed?: boolean;
};

/**
 * A flat status ring on the ground around a piece of equipment. This is how a scene shows state:
 * the machine stays steel, the ring takes the status colour, and a `SceneLabel` says it in words.
 */
export function StatusBeacon({ tone, radius = 3, pulse = false, dimmed = false }: StatusBeaconProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const halo = useRef<Mesh>(null);
  const haloMaterial = useRef<MeshBasicMaterial>(null);
  const animate = pulse && !reducedMotion && !dimmed;
  const baseOpacity = dimmed ? 0.25 : 0.9;

  useFrame((state) => {
    if (!animate || !halo.current || !haloMaterial.current) return;
    const phase = (state.clock.elapsedTime % 2.4) / 2.4;
    const scale = 1 + phase * 0.55;
    halo.current.scale.set(scale, scale, 1);
    haloMaterial.current.opacity = 0.5 * (1 - phase);
    state.invalidate();
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
      <mesh>
        <ringGeometry args={[radius * 0.9, radius, 48]} />
        <meshBasicMaterial color={palette[tone].color} transparent opacity={baseOpacity} depthWrite={false} />
      </mesh>
      {pulse && !dimmed ? (
        <mesh ref={halo}>
          <ringGeometry args={[radius, radius * 1.12, 48]} />
          <meshBasicMaterial ref={haloMaterial} color={palette[tone].color} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

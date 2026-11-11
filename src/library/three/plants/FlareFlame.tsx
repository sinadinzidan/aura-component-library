import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

export type FlareFlameProps = {
  /** The flare tip: where the flame starts. */
  position: Vec3;
  /** Flame height. A pilot is about 2.5; gas on flare is 8 or more. */
  height?: number;
};

/**
 * The flame of a flare that is burning gas, to add on top of a `FlareStack` when gas is routed to
 * it. Much larger than the pilot, with a slow sway; it holds still under reduced motion.
 */
export function FlareFlame({ position, height = 9 }: FlareFlameProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const flame = useRef<Group>(null);

  useFrame((state) => {
    if (reducedMotion || !flame.current) return;
    const time = state.clock.elapsedTime;
    flame.current.scale.set(1 + Math.sin(time * 5.3) * 0.08, 1 + Math.sin(time * 4.1) * 0.1 + Math.sin(time * 9.2) * 0.05, 1 + Math.cos(time * 4.7) * 0.08);
    flame.current.rotation.z = Math.sin(time * 1.7) * 0.06;
    state.invalidate();
  });

  return (
    <group ref={flame} position={toTuple(position)}>
      <mesh position={[0, height / 2, 0]}>
        <coneGeometry args={[height * 0.2, height, 14]} />
        <meshBasicMaterial color={palette.flame.color} transparent opacity={0.8 * palette.flame.opacity} depthWrite={false} />
      </mesh>
      <mesh position={[0, height * 0.32, 0]}>
        <coneGeometry args={[height * 0.12, height * 0.64, 12]} />
        <meshBasicMaterial color={palette.warning.color} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh position={[0, height * 0.16, 0]}>
        <sphereGeometry args={[height * 0.3, 16, 12]} />
        <meshBasicMaterial color={palette.flame.color} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

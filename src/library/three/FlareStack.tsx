import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useSceneEnvironment } from './sceneEnvironment';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type FlareStackProps = EquipmentProps & {
  height?: number;
  /** Whether the pilot flame is lit. */
  lit?: boolean;
};

/**
 * A flare stack with a derrick base and a pilot flame. The flame flickers gently, and holds still
 * under reduced motion.
 */
export function FlareStack({ height = 30, lit = true, hovered, selected, dimmed, ...base }: FlareStackProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const { steel, frame } = useEquipmentMaterials({ hovered, selected, dimmed });
  const flame = useRef<Group>(null);
  const animate = lit && !reducedMotion && !dimmed;

  useFrame((state) => {
    if (!animate || !flame.current) return;
    const time = state.clock.elapsedTime;
    const flicker = 1 + Math.sin(time * 5.1) * 0.08 + Math.sin(time * 8.7) * 0.05;
    flame.current.scale.set(1 + Math.sin(time * 6.3) * 0.05, flicker, 1 + Math.cos(time * 4.4) * 0.05);
    state.invalidate();
  });

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={2.4}>
      <mesh position={[0, 0.2, 0]} material={frame}>
        <boxGeometry args={[3, 0.4, 3]} />
      </mesh>
      {/* Derrick legs */}
      {[0, 1, 2, 3].map((corner) => {
        const angle = (corner * Math.PI) / 2 + Math.PI / 4;
        return (
          <mesh
            key={corner}
            position={[Math.cos(angle) * 0.9, height * 0.2, Math.sin(angle) * 0.9]}
            rotation={[Math.sin(angle) * 0.1, 0, -Math.cos(angle) * 0.1]}
            material={frame}
          >
            <cylinderGeometry args={[0.07, 0.1, height * 0.4, 6]} />
          </mesh>
        );
      })}
      <mesh position={[0, height / 2, 0]} material={steel}>
        <cylinderGeometry args={[0.32, 0.5, height, 16]} />
      </mesh>
      <mesh position={[0, height + 0.4, 0]} material={frame}>
        <cylinderGeometry args={[0.55, 0.38, 0.9, 16]} />
      </mesh>
      {lit ? (
        <group ref={flame} position={[0, height + 0.85, 0]}>
          <mesh position={[0, 1.3, 0]}>
            <coneGeometry args={[0.6, 2.6, 12]} />
            <meshBasicMaterial color={palette.flame.color} transparent opacity={(dimmed ? 0.25 : 0.85) * palette.flame.opacity} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.32, 1.5, 10]} />
            <meshBasicMaterial color={palette.warning.color} transparent opacity={dimmed ? 0.2 : 0.9} depthWrite={false} />
          </mesh>
        </group>
      ) : null}
    </EquipmentBase>
  );
}

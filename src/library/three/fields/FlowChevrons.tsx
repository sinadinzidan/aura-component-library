import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import type { Vec3 } from '../cameraTargets';
import { chevronDistances, pointAlong, polylineLength, quaternionFromY } from '../pipeGeometry';
import { useSceneEnvironment } from '../sceneEnvironment';

export type FlowChevronsProps = {
  /** The line the chevrons follow. They point from the first point to the last. */
  points: readonly Vec3[];
  /** Resolved colour. */
  color: string;
  /** Radius of the line; chevrons scale with it. */
  radius?: number;
  spacing?: number;
  /** Units per second. They hold still under reduced motion. */
  speed?: number;
  dimmed?: boolean;
};

/** Cones that run along a curved line to show the direction of flow. A static row of cones under reduced motion. */
export function FlowChevrons({ points, color, radius = 0.25, spacing = 6, speed = 2.2, dimmed = false }: FlowChevronsProps) {
  const { reducedMotion } = useSceneEnvironment();
  const group = useRef<Group>(null);
  const total = useMemo(() => polylineLength(points), [points]);
  const count = chevronDistances(total, spacing).length;
  const animate = speed > 0 && !reducedMotion && !dimmed;

  const place = (offset: number) => {
    const root = group.current;
    if (!root) return;
    const distances = chevronDistances(total, spacing, offset);
    root.children.forEach((child, index) => {
      const sample = distances[index] === undefined ? null : pointAlong(points, distances[index]);
      child.visible = sample !== null;
      if (!sample) return;
      child.position.set(sample.position[0], sample.position[1], sample.position[2]);
      const [x, y, z, w] = quaternionFromY(sample.direction);
      child.quaternion.set(x, y, z, w);
    });
  };

  useFrame((state) => {
    place(animate ? state.clock.elapsedTime * speed : 0);
    if (animate) state.invalidate();
  });

  if (count === 0) return null;
  return (
    <group ref={group}>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} renderOrder={5}>
          <coneGeometry args={[radius * 2.2, radius * 4.4, 8]} />
          <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.12 : 0.95} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

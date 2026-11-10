import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import { toTuple } from './cameraTargets';
import type { Vec3 } from './cameraTargets';
import { chevronDistances, pointAlong, polylineLength, quaternionFromY } from './pipeGeometry';
import { useSceneEnvironment } from './sceneEnvironment';
import type { SceneTone } from './scenePalette';
import { Strut } from './Strut';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type PipeRunProps = {
  /** The route, corner to corner. Flow runs from the first point to the last. */
  points: readonly Vec3[];
  radius?: number;
  /** Chevrons along the pipe showing which way it flows. */
  flow?: boolean;
  /** Colour of the chevrons: the accent by default, a status tone for an abnormal line. */
  flowTone?: SceneTone;
  /** Distance between chevrons. */
  spacing?: number;
  /** Chevron speed in units per second. Chevrons hold still under reduced motion or at 0. */
  speed?: number;
  dimmed?: boolean;
};

/** A pipe along a route of straight segments with ball elbows, optionally with moving flow chevrons. */
export function PipeRun({ points, radius = 0.25, flow = false, flowTone, spacing = 5, speed = 1.6, dimmed = false }: PipeRunProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const { pipe } = useEquipmentMaterials({ dimmed });
  const chevrons = useRef<Group>(null);
  const total = useMemo(() => polylineLength(points), [points]);
  const count = flow ? chevronDistances(total, spacing).length : 0;
  const animate = flow && speed > 0 && !reducedMotion && !dimmed;

  const place = (offset: number) => {
    const group = chevrons.current;
    if (!group) return;
    const distances = chevronDistances(total, spacing, offset);
    group.children.forEach((child, index) => {
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

  return (
    <group>
      {points.slice(1).map((point, index) => (
        <Strut key={index} from={points[index]} to={point} radius={radius} material={pipe} />
      ))}
      {points.slice(1, -1).map((point, index) => (
        <mesh key={index} position={toTuple(point)} material={pipe}>
          <sphereGeometry args={[radius * 1.15, 12, 8]} />
        </mesh>
      ))}
      {count > 0 ? (
        <group ref={chevrons}>
          {Array.from({ length: count }, (_, index) => (
            <mesh key={index}>
              <coneGeometry args={[radius * 1.5, radius * 2.8, 10]} />
              <meshBasicMaterial color={palette[flowTone ?? 'accent'].color} transparent opacity={dimmed ? 0.2 : 0.95} depthWrite={!dimmed} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
}

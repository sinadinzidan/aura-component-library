import { useMemo } from 'react';
import type { Material } from 'three';

import { toTuple } from './cameraTargets';
import type { Vec3 } from './cameraTargets';
import { segmentTransform } from './pipeGeometry';

export type StrutProps = {
  from: Vec3;
  to: Vec3;
  radius?: number;
  material: Material;
  /** Sides of the cross-section. 4 gives a square beam, 12 or more a round tube. */
  segments?: number;
};

/** A straight member between two points: a pipe segment, a beam, a brace or a leg. */
export function Strut({ from, to, radius = 0.15, material, segments = 12 }: StrutProps) {
  const transform = useMemo(() => segmentTransform(from, to), [from, to]);
  const [x, y, z, w] = transform.quaternion;

  return (
    <mesh position={toTuple(transform.center)} quaternion={[x, y, z, w]} material={material}>
      <cylinderGeometry args={[radius, radius, transform.length, segments]} />
    </mesh>
  );
}

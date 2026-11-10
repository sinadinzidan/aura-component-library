import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Group } from 'three';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

export type ExplodeGroupProps = {
  /** Where the content should sit relative to its assembled position. See `explodeOffset`. */
  offset: Vec3;
  children: ReactNode;
};

/**
 * Moves its content to an offset and eases there when the offset changes, so parts of an exploded
 * view glide instead of jumping. Under reduced motion the content is placed at once.
 */
export function ExplodeGroup({ offset, children }: ExplodeGroupProps) {
  const group = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const { reducedMotion } = useSceneEnvironment();
  const [initial] = useState(() => toTuple(offset));
  const [x, y, z] = offset;

  useEffect(() => {
    invalidate();
  }, [x, y, z, invalidate]);

  useFrame((_, delta) => {
    const current = group.current?.position;
    if (!current) return;
    const ease = reducedMotion ? 1 : Math.min(1, Math.max(delta, 0.016) * 10);
    current.set(current.x + (x - current.x) * ease, current.y + (y - current.y) * ease, current.z + (z - current.z) * ease);
    const settled = Math.abs(x - current.x) < 0.005 && Math.abs(y - current.y) < 0.005 && Math.abs(z - current.z) < 0.005;
    if (settled) current.set(x, y, z);
    else invalidate();
  });

  return (
    <group ref={group} position={initial}>
      {children}
    </group>
  );
}

import { useMemo } from 'react';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type JettyProps = {
  /** The landward end, at ground level. The jetty runs out along +x from here. */
  position?: Vec3;
  rotationY?: number;
  length?: number;
  width?: number;
  /** Deck height above the water. */
  height?: number;
  /** How far the piles reach below the deck level, into the water. */
  pileDepth?: number;
  dimmed?: boolean;
};

/**
 * A loading jetty: a trestle on piles running out over the water to a berth head with a marine
 * loading arm. Pair it with a `SeaPlane` so the piles run on below the surface.
 */
export function Jetty({ position = [0, 0, 0], rotationY = 0, length = 24, width = 4, height = 3, pileDepth = 7, dimmed = false }: JettyProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ dimmed });
  const bents = Math.max(2, Math.round(length / 6) + 1);
  const piles = useMemo(
    () =>
      Array.from({ length: bents }, (_, index) => (length * index) / (bents - 1)).flatMap((x) =>
        [-1, 1].map((side) => ({ from: [x, height - pileDepth, (side * width) / 2 - side * 0.4] as const, to: [x, height, (side * width) / 2 - side * 0.4] as const }))
      ),
    [bents, length, width, height, pileDepth]
  );
  const arm = useMemo(
    () => [
      { from: [length + 1, height, 0] as const, to: [length + 1, height + 6, 0] as const },
      { from: [length + 1, height + 6, 0] as const, to: [length + 5, height + 7.5, 0] as const },
      { from: [length + 5, height + 7.5, 0] as const, to: [length + 7, height + 3.5, 0] as const },
    ],
    [length, height]
  );

  return (
    <group position={toTuple(position)} rotation={[0, rotationY, 0]}>
      <mesh position={[length / 2, height - 0.25, 0]} material={steel}>
        <boxGeometry args={[length, 0.5, width]} />
      </mesh>
      {/* Berth head */}
      <mesh position={[length + 1.5, height - 0.25, 0]} material={steel}>
        <boxGeometry args={[7, 0.5, width * 2.4]} />
      </mesh>
      {piles.map((pile, index) => (
        <Strut key={index} from={pile.from} to={pile.to} radius={0.28} segments={8} material={frame} />
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[length + 1.5, height - pileDepth / 2, side * width * 0.95]} material={frame}>
          <cylinderGeometry args={[0.4, 0.4, pileDepth, 8]} />
        </mesh>
      ))}
      {arm.map((piece, index) => (
        <Strut key={index} from={piece.from} to={piece.to} radius={0.22} material={pipe} />
      ))}
      <mesh position={[length + 1, height + 0.6, 0]} material={frame}>
        <boxGeometry args={[1.6, 1.2, 1.6]} />
      </mesh>
    </group>
  );
}

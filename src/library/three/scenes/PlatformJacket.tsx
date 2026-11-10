import { useMemo } from 'react';

import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { LatticeFrame } from './LatticeFrame';
import { towerMembers } from './latticeGeometry';

export type PlatformJacketProps = {
  /** Width (x) and depth (z) where the legs meet the deck. */
  topSize?: readonly [number, number];
  /** Width (x) and depth (z) at the foot. Wider than the top: jacket legs are battered. */
  baseSize?: readonly [number, number];
  /** Height of the top of the jacket, where the lowest deck lands. */
  topY?: number;
  /** Height of the foot. Below the waterline, so the legs run on under a `SeaPlane`. */
  bottomY?: number;
  bays?: number;
  /** Number of conductor and riser pipes hanging in the middle. */
  risers?: number;
  dimmed?: boolean;
};

/**
 * The steel jacket an offshore platform stands on: four battered legs with horizontal frames and
 * X-bracing, and a row of risers running down through the middle into the sea.
 */
export function PlatformJacket({ topSize = [30, 18], baseSize = [42, 28], topY = 12, bottomY = -14, bays = 3, risers = 4, dimmed = false }: PlatformJacketProps) {
  const { frame, pipe } = useEquipmentMaterials({ dimmed });
  const [topX, topZ] = topSize;
  const [baseX, baseZ] = baseSize;
  const members = useMemo(() => towerMembers({ base: [baseX, baseZ], top: [topX, topZ], bottomY, topY, bays }), [baseX, baseZ, topX, topZ, bottomY, topY, bays]);
  const riserRoutes = useMemo(
    () =>
      Array.from({ length: Math.max(0, risers) }, (_, index) => {
        const x = (index - (risers - 1) / 2) * 2.2;
        return { from: [x, bottomY, 0] as const, to: [x, topY, 0] as const };
      }),
    [risers, bottomY, topY]
  );

  return (
    <group>
      <LatticeFrame members={members} material={frame} legRadius={0.55} braceRadius={0.2} />
      {riserRoutes.map((riser, index) => (
        <Strut key={index} from={riser.from} to={riser.to} radius={0.28} material={pipe} />
      ))}
    </group>
  );
}

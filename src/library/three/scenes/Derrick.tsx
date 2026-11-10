import { useMemo } from 'react';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { LatticeFrame } from './LatticeFrame';
import { towerMembers } from './latticeGeometry';

export type DerrickProps = {
  position?: Vec3;
  /** Height of the lattice tower above the drill floor. */
  height?: number;
  /** Side of the tower at the drill floor. */
  base?: number;
  /** Side of the tower at the crown. */
  top?: number;
  bays?: number;
  dimmed?: boolean;
};

const FLOOR_HEIGHT = 2;

/**
 * A drilling derrick: a tapered lattice tower on a raised drill floor, with the crown block and a
 * mast on top and the drill string hanging down the middle.
 */
export function Derrick({ position = [0, 0, 0], height = 24, base = 7, top = 2, bays = 6, dimmed = false }: DerrickProps) {
  const { frame, steel, pipe } = useEquipmentMaterials({ dimmed });
  const members = useMemo(() => towerMembers({ base: [base, base], top: [top, top], bottomY: FLOOR_HEIGHT, topY: FLOOR_HEIGHT + height, bays, bracing: 'zigzag' }), [base, top, height, bays]);

  return (
    <group position={toTuple(position)}>
      <mesh position={[0, FLOOR_HEIGHT / 2, 0]} material={steel}>
        <boxGeometry args={[base + 2, FLOOR_HEIGHT, base + 2]} />
      </mesh>
      <LatticeFrame members={members} material={frame} legRadius={0.2} braceRadius={0.08} />
      <mesh position={[0, FLOOR_HEIGHT + height + 0.4, 0]} material={steel}>
        <boxGeometry args={[top + 0.8, 0.8, top + 0.8]} />
      </mesh>
      <mesh position={[0, FLOOR_HEIGHT + height + 2.3, 0]} material={frame}>
        <cylinderGeometry args={[0.06, 0.1, 3, 6]} />
      </mesh>
      <mesh position={[0, FLOOR_HEIGHT + height / 2, 0]} material={pipe}>
        <cylinderGeometry args={[0.14, 0.14, height, 8]} />
      </mesh>
    </group>
  );
}

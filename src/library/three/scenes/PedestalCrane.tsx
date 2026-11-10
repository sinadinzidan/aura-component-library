import { useMemo } from 'react';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { LatticeFrame } from './LatticeFrame';
import { boomMembers } from './latticeGeometry';

export type PedestalCraneProps = {
  position?: Vec3;
  /** Slew angle around the pedestal, in radians. 0 points east (+x). */
  rotationY?: number;
  /** Height of the pedestal up to the slew ring. */
  pedestal?: number;
  /** Boom length. */
  boom?: number;
  /** Boom angle above the horizontal, in radians. */
  elevation?: number;
  dimmed?: boolean;
};

/** An offshore pedestal crane: column, machinery house with cab, a lattice boom and the hook line. */
export function PedestalCrane({ position = [0, 0, 0], rotationY = 0, pedestal = 6, boom = 20, elevation = 0.75, dimmed = false }: PedestalCraneProps) {
  const { frame, steel, detail } = useEquipmentMaterials({ dimmed });
  const members = useMemo(() => boomMembers({ length: boom, width: 1.6, tipWidth: 0.5, bays: Math.max(3, Math.round(boom / 3.5)) }), [boom]);
  const tipX = 1.2 + Math.cos(elevation) * boom;
  const tipY = pedestal + 1.2 + Math.sin(elevation) * boom;
  const hook = useMemo(() => ({ from: [tipX, tipY, 0] as const, to: [tipX, Math.max(2.5, tipY * 0.35), 0] as const }), [tipX, tipY]);

  return (
    <group position={toTuple(position)} rotation={[0, rotationY, 0]}>
      <mesh position={[0, pedestal / 2, 0]} material={frame}>
        <cylinderGeometry args={[0.9, 1.1, pedestal, 14]} />
      </mesh>
      <mesh position={[-0.6, pedestal + 1.3, 0]} material={steel}>
        <boxGeometry args={[4.2, 2.6, 3]} />
      </mesh>
      <mesh position={[1.7, pedestal + 1.6, 1.1]} material={detail}>
        <boxGeometry args={[1.2, 1.4, 1.1]} />
      </mesh>
      <group position={[1.2, pedestal + 1.2, 0]} rotation={[0, 0, elevation]}>
        <LatticeFrame members={members} material={frame} legRadius={0.1} braceRadius={0.05} />
      </group>
      <Strut from={hook.from} to={hook.to} radius={0.04} segments={4} material={frame} />
      <mesh position={[hook.to[0], hook.to[1] - 0.35, 0]} material={steel}>
        <boxGeometry args={[0.6, 0.7, 0.4]} />
      </mesh>
    </group>
  );
}

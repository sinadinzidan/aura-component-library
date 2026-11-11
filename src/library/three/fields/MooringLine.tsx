import { useMemo } from 'react';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { WellTube } from '../models/WellTube';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { catenaryPoints } from './lazyWave';

export type MooringLineProps = {
  id: string;
  /** The anchor on the seabed. */
  anchor: Vec3;
  /** The fairlead on the vessel's turret. */
  fairlead: Vec3;
  /** Resolved colour of the mooring system. */
  color: string;
  radius?: number;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: (id: string) => void;
};

/** A catenary mooring line from a suction anchor on the seabed up to the turret. It lies flat at the anchor and steepens towards the vessel. */
export function MooringLine({ id, anchor, fairlead, color, radius = 0.16, selected = false, dimmed = false, onSelect }: MooringLineProps) {
  const { frame } = useEquipmentMaterials({ dimmed });
  const points = useMemo(() => catenaryPoints(anchor, fairlead, 22), [anchor, fairlead]);

  return (
    <group>
      <WellTube id={id} points={points} color={color} radius={radius} selected={selected} dimmed={dimmed} onSelect={onSelect} />
      <mesh position={toTuple([anchor[0], anchor[1] + 0.5, anchor[2]])} material={frame}>
        <cylinderGeometry args={[0.9, 0.9, 1.6, 14]} />
      </mesh>
    </group>
  );
}

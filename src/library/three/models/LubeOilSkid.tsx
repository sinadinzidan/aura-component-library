import type { EquipmentVisualState } from '../equipmentMaterials';
import { Strut } from '../Strut';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { AxialCylinder } from './AxialCylinder';

export type LubeOilSkidProps = EquipmentVisualState;

const X = 5.8;
const Z = 4.3;

/** The lube oil skid: reservoir, shell-and-tube cooler, duty and standby pumps with motors, duplex filters and the supply header. */
export function LubeOilSkid(state: LubeOilSkidProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials(state);

  return (
    <group>
      <mesh position={[X, 0.1, Z]} material={frame}>
        <boxGeometry args={[4.8, 0.2, 2]} />
      </mesh>
      {/* Reservoir with level glass and fill cap */}
      <mesh position={[X - 0.9, 0.85, Z - 0.2]} material={steel}>
        <boxGeometry args={[2.6, 1.3, 1.4]} />
      </mesh>
      <mesh position={[X - 2.22, 0.9, Z - 0.2]} material={detail}>
        <boxGeometry args={[0.04, 0.8, 0.12]} />
      </mesh>
      <mesh position={[X - 1.7, 1.58, Z - 0.5]} material={frame}>
        <cylinderGeometry args={[0.16, 0.16, 0.16, 12]} />
      </mesh>
      {/* Cooler on top of the reservoir */}
      <AxialCylinder x={X - 0.9} y={1.95} z={Z - 0.2} radius={0.36} length={2.3} material={steel} segments={18} />
      {[-1.2, 1.2].map((offset) => (
        <AxialCylinder key={offset} x={X - 0.9 + offset} y={1.95} z={Z - 0.2} radius={0.44} length={0.1} material={frame} segments={18} />
      ))}
      {[-0.6, 0.6].map((offset) => (
        <mesh key={offset} position={[X - 0.9 + offset, 1.55, Z - 0.2]} material={frame}>
          <boxGeometry args={[0.16, 0.14, 0.7]} />
        </mesh>
      ))}
      {/* Duty and standby pumps */}
      {[-0.45, 0.45].map((offset) => (
        <group key={offset} position={[X + 1.5, 0.55, Z + offset - 0.1]}>
          <AxialCylinder x={-0.2} radius={0.24} length={0.7} material={steel} segments={14} />
          <AxialCylinder x={0.35} radius={0.18} length={0.4} material={pipe} segments={14} />
        </group>
      ))}
      {/* Duplex filters */}
      {[-0.3, 0.3].map((offset) => (
        <mesh key={offset} position={[X + 2.1, 0.75, Z + offset - 0.1]} material={pipe}>
          <cylinderGeometry args={[0.17, 0.17, 1.1, 12]} />
        </mesh>
      ))}
      {/* Supply header with pressure transmitter tapping */}
      <Strut from={[X + 2.1, 1.35, Z - 0.1]} to={[X - 1.2, 2.45, Z - 0.1]} radius={0.06} material={pipe} segments={8} />
      <Strut from={[X - 1.2, 2.45, Z - 0.1]} to={[X - 1.2, 2.45, Z - 0.9]} radius={0.06} material={pipe} segments={8} />
    </group>
  );
}

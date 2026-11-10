import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type ShutdownValveProps = EquipmentProps & {
  /** Nominal bore of the line the valve sits in. */
  bore?: number;
};

const HALF_TURN = Math.PI / 2;

/** An actuated on/off valve in a line stub on two supports: body, flanges, yoke and actuator. */
export function ShutdownValve({ bore = 0.6, hovered, selected, dimmed, ...base }: ShutdownValveProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = bore / 2;
  const axis = 1;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={1.9}>
      <mesh position={[0, axis, 0]} rotation={[0, 0, HALF_TURN]} material={pipe}>
        <cylinderGeometry args={[radius, radius, 2.8, 14]} />
      </mesh>
      <mesh position={[0, axis, 0]} material={steel}>
        <sphereGeometry args={[radius * 1.9, 18, 12]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * radius * 2.3, axis, 0]} rotation={[0, 0, HALF_TURN]} material={frame}>
          <cylinderGeometry args={[radius * 1.7, radius * 1.7, 0.14, 14]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.1, (axis - radius) / 2, 0]} material={frame}>
          <boxGeometry args={[0.2, axis - radius, 0.5]} />
        </mesh>
      ))}
      {/* Yoke and actuator */}
      <mesh position={[0, axis + radius * 1.9 + 0.3, 0]} material={frame}>
        <boxGeometry args={[0.24, 0.6, 0.24]} />
      </mesh>
      <mesh position={[0, axis + radius * 1.9 + 0.9, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[0.36, 0.36, 1.5, 14]} />
      </mesh>
      <mesh position={[0.85, axis + radius * 1.9 + 0.9, 0]} rotation={[0, 0, HALF_TURN]} material={detail}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 10]} />
      </mesh>
    </EquipmentBase>
  );
}

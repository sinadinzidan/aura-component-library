import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type HorizontalVesselProps = EquipmentProps & {
  /** Overall length along x, heads included. */
  length?: number;
  diameter?: number;
};

const HALF_TURN = Math.PI / 2;

/** A horizontal pressure vessel on two saddles, with a manway and nozzles: separators, drums, scrubbers. */
export function HorizontalVessel({ length = 9, diameter = 3, hovered, selected, dimmed, ...base }: HorizontalVesselProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = diameter / 2;
  const headDepth = radius * 0.55;
  const shell = length - headDepth * 2;
  const axis = radius + 0.9;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, diameter) / 2 + 0.6}>
      <mesh position={[0, axis, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[radius, radius, shell, 28]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * shell) / 2, axis, 0]} scale={[headDepth / radius, 1, 1]} material={steel}>
          <sphereGeometry args={[radius, 24, 16]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * shell * 0.3, (axis - radius * 0.5) / 2, 0]} material={frame}>
          <boxGeometry args={[0.5, axis - radius * 0.5, diameter * 0.82]} />
        </mesh>
      ))}
      {/* Manway */}
      <mesh position={[-shell * 0.28, axis + radius + 0.2, 0]} material={steel}>
        <cylinderGeometry args={[0.42, 0.42, 0.7, 16]} />
      </mesh>
      <mesh position={[-shell * 0.28, axis + radius + 0.58, 0]} material={frame}>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
      </mesh>
      {/* Gas outlet and relief nozzles */}
      {[0.08, 0.34].map((offset) => (
        <group key={offset} position={[shell * offset, axis + radius, 0]}>
          <mesh position={[0, 0.3, 0]} material={pipe}>
            <cylinderGeometry args={[0.2, 0.2, 0.8, 12]} />
          </mesh>
          <mesh position={[0, 0.7, 0]} material={frame}>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 12]} />
          </mesh>
        </group>
      ))}
      {/* Inlet nozzle on the west head */}
      <mesh position={[-length / 2 - 0.2, axis, 0]} rotation={[0, 0, HALF_TURN]} material={pipe}>
        <cylinderGeometry args={[0.26, 0.26, 0.8, 12]} />
      </mesh>
      {/* Liquid outlet */}
      <mesh position={[shell * 0.3 + 0.9, axis - radius - 0.15, 0]} material={pipe}>
        <cylinderGeometry args={[0.18, 0.18, 0.6, 12]} />
      </mesh>
    </EquipmentBase>
  );
}

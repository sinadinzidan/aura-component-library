import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type AirCoolerProps = EquipmentProps & {
  length?: number;
  width?: number;
  /** Height of the tube bundle above ground. */
  height?: number;
  fans?: number;
};

/** A fin-fan air cooler: an elevated tube bundle on legs with fan rings underneath. */
export function AirCooler({ length = 10, width = 5, height = 4, fans = 2, hovered, selected, dimmed, ...base }: AirCoolerProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const fanRadius = Math.min(width, length / fans) * 0.4;
  const fanCentres = Array.from({ length: fans }, (_, index) => -length / 2 + (length / fans) * (index + 0.5));

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, width) / 2 + 0.6}>
      {[-1, 1].flatMap((sideX) =>
        [-1, 1].map((sideZ) => (
          <mesh key={`${sideX}${sideZ}`} position={[sideX * (length / 2 - 0.3), height / 2, sideZ * (width / 2 - 0.3)]} material={frame}>
            <boxGeometry args={[0.3, height, 0.3]} />
          </mesh>
        ))
      )}
      {/* Plenum and tube bundle */}
      <mesh position={[0, height + 0.3, 0]} material={steel}>
        <boxGeometry args={[length, 0.6, width]} />
      </mesh>
      <mesh position={[0, height + 0.75, 0]} material={frame}>
        <boxGeometry args={[length * 0.96, 0.3, width * 0.94]} />
      </mesh>
      {/* Headers */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (length / 2 + 0.2), height + 0.55, 0]} material={pipe}>
          <boxGeometry args={[0.4, 0.8, width * 0.9]} />
        </mesh>
      ))}
      {fanCentres.map((x) => (
        <group key={x} position={[x, height - 0.35, 0]}>
          <mesh material={steel}>
            <cylinderGeometry args={[fanRadius, fanRadius * 0.85, 0.7, 24, 1, true]} />
          </mesh>
          <mesh position={[0, -0.2, 0]} material={frame}>
            <cylinderGeometry args={[0.35, 0.35, 0.6, 12]} />
          </mesh>
        </group>
      ))}
    </EquipmentBase>
  );
}

import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type GasTurbineProps = EquipmentProps & {
  length?: number;
  width?: number;
};

/** A packaged gas turbine driver: acoustic enclosure, raised inlet filter house and an exhaust stack. */
export function GasTurbine({ length = 10, width = 3.4, hovered, selected, dimmed, ...base }: GasTurbineProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const deck = 0.4;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, width) / 2 + 0.6}>
      <mesh position={[0, deck / 2, 0]} material={frame}>
        <boxGeometry args={[length, deck, width]} />
      </mesh>
      {/* Enclosure */}
      <mesh position={[-length * 0.05, deck + 1.4, 0]} material={steel}>
        <boxGeometry args={[length * 0.56, 2.8, width * 0.86]} />
      </mesh>
      {[-0.22, 0, 0.22].map((offset) => (
        <mesh key={offset} position={[-length * 0.05 + offset * length, deck + 1.4, width * 0.43 + 0.03]} material={frame}>
          <boxGeometry args={[0.9, 2, 0.06]} />
        </mesh>
      ))}
      {/* Inlet filter house and duct */}
      <mesh position={[-length * 0.38, deck + 4.2, 0]} material={steel}>
        <boxGeometry args={[length * 0.24, 2.2, width]} />
      </mesh>
      <mesh position={[-length * 0.36, deck + 2.6, 0]} material={frame}>
        <boxGeometry args={[length * 0.14, 1.4, width * 0.6]} />
      </mesh>
      {/* Exhaust stack */}
      <mesh position={[length * 0.36, deck + 1, 0]} material={frame}>
        <boxGeometry args={[length * 0.2, 2, width * 0.7]} />
      </mesh>
      <mesh position={[length * 0.36, deck + 4, 0]} material={steel}>
        <cylinderGeometry args={[0.75, 0.9, 4.2, 18]} />
      </mesh>
      {/* Fuel gas line */}
      <mesh position={[length * 0.12, deck + 3, 0]} material={pipe}>
        <cylinderGeometry args={[0.12, 0.12, 0.6, 8]} />
      </mesh>
    </EquipmentBase>
  );
}

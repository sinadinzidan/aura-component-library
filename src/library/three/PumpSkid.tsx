import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type PumpSkidProps = EquipmentProps & {
  length?: number;
  width?: number;
};

const HALF_TURN = Math.PI / 2;

/** A centrifugal pump and motor on a baseplate, with end suction and top discharge. */
export function PumpSkid({ length = 4, width = 1.8, hovered, selected, dimmed, ...base }: PumpSkidProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials({ hovered, selected, dimmed });
  const deck = 0.25;
  const shaft = deck + 0.75;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(length, width) / 2 + 0.5}>
      <mesh position={[0, deck / 2, 0]} material={frame}>
        <boxGeometry args={[length, deck, width]} />
      </mesh>
      {/* Volute */}
      <mesh position={[-length * 0.28, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[0.72, 0.72, 0.6, 20]} />
      </mesh>
      {/* Suction */}
      <mesh position={[-length * 0.44, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={pipe}>
        <cylinderGeometry args={[0.26, 0.26, 0.7, 12]} />
      </mesh>
      {/* Discharge */}
      <mesh position={[-length * 0.28, shaft + 0.9, 0]} material={pipe}>
        <cylinderGeometry args={[0.2, 0.2, 0.7, 12]} />
      </mesh>
      {/* Bearing housing and coupling */}
      <mesh position={[-length * 0.1, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 12]} />
      </mesh>
      <mesh position={[length * 0.03, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={detail}>
        <cylinderGeometry args={[0.2, 0.2, 0.35, 10]} />
      </mesh>
      {/* Motor */}
      <mesh position={[length * 0.26, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={steel}>
        <cylinderGeometry args={[0.55, 0.55, length * 0.36, 20]} />
      </mesh>
      <mesh position={[length * 0.45, shaft, 0]} rotation={[0, 0, HALF_TURN]} material={frame}>
        <cylinderGeometry args={[0.6, 0.6, 0.18, 20]} />
      </mesh>
      <mesh position={[length * 0.26, shaft + 0.62, 0]} material={frame}>
        <boxGeometry args={[0.5, 0.3, 0.5]} />
      </mesh>
    </EquipmentBase>
  );
}

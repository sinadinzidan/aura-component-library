import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { TRAIN_DECK_HEIGHT } from './compressorTrainLayout';

export type InstrumentStandProps = EquipmentVisualState & {
  /** Foot of the stand on the deck: x along the shaft, z across it. */
  x: number;
  z: number;
  /** Number of transmitters on the stand, stacked from the top. */
  transmitters?: number;
};

/** A 2-inch pipe stand carrying one or more transmitters, as found beside every nozzle with a measurement. */
export function InstrumentStand({ x, z, transmitters = 1, ...state }: InstrumentStandProps) {
  const { frame, pipe, detail } = useEquipmentMaterials(state);
  const height = 1.5;

  return (
    <group position={[x, TRAIN_DECK_HEIGHT, z]}>
      <mesh position={[0, 0.03, 0]} material={frame}>
        <boxGeometry args={[0.3, 0.06, 0.3]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={pipe}>
        <cylinderGeometry args={[0.05, 0.05, height, 8]} />
      </mesh>
      {Array.from({ length: Math.max(1, transmitters) }, (_, index) => (
        <group key={index} position={[0, height - 0.12 - index * 0.42, 0.12]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={detail}>
            <cylinderGeometry args={[0.15, 0.15, 0.22, 14]} />
          </mesh>
          <mesh position={[0, -0.18, 0]} material={frame}>
            <boxGeometry args={[0.16, 0.16, 0.12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

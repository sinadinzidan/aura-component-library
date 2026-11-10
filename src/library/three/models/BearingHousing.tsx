import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { AxialCylinder } from './AxialCylinder';
import { TRAIN_DECK_HEIGHT, TRAIN_SHAFT_HEIGHT } from './compressorTrainLayout';

export type BearingHousingProps = EquipmentVisualState & {
  /** Centre of the housing along the shaft. */
  x: number;
  /** Closes the outboard side with an end cap, for the non-drive end. */
  endCap?: boolean;
};

const SHAFT = TRAIN_SHAFT_HEIGHT;

/** A bearing housing on its pedestal: split housing, oil supply and drain, and a vibration probe boss on top. */
export function BearingHousing({ x, endCap = false, ...state }: BearingHousingProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials(state);

  return (
    <group>
      <AxialCylinder x={x} y={SHAFT} radius={0.58} length={0.66} material={steel} segments={20} />
      <mesh position={[x, SHAFT, 0]} material={frame}>
        <boxGeometry args={[0.7, 0.1, 1.3]} />
      </mesh>
      {endCap ? (
        <mesh position={[x - 0.33, SHAFT, 0]} rotation={[0, 0, Math.PI / 2]} material={frame}>
          <sphereGeometry args={[0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ) : null}
      {/* Vibration probe boss */}
      <mesh position={[x, SHAFT + 0.62, 0.25]} rotation={[0.4, 0, 0]} material={detail}>
        <cylinderGeometry args={[0.07, 0.07, 0.3, 8]} />
      </mesh>
      {/* Oil supply and drain */}
      <mesh position={[x, SHAFT - 0.9, 0.45]} material={pipe}>
        <cylinderGeometry args={[0.06, 0.06, 1, 8]} />
      </mesh>
      {/* Pedestal */}
      <mesh position={[x, (TRAIN_DECK_HEIGHT + SHAFT - 0.5) / 2, 0]} material={frame}>
        <boxGeometry args={[0.5, SHAFT - 0.5 - TRAIN_DECK_HEIGHT, 1.1]} />
      </mesh>
    </group>
  );
}

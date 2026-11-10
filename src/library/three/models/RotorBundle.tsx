import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { AxialCylinder } from './AxialCylinder';
import { TRAIN_SHAFT_HEIGHT } from './compressorTrainLayout';

export type RotorBundleProps = EquipmentVisualState & {
  /** Number of impeller stages. */
  stages?: number;
};

const SHAFT = TRAIN_SHAFT_HEIGHT;
const FIRST_STAGE_X = -5.9;
const STAGE_PITCH = 0.7;

/** Positions of the impellers along the shaft, suction end first. */
export function impellerPositions(stages: number): number[] {
  return Array.from({ length: Math.max(0, Math.floor(stages)) }, (_, index) => FIRST_STAGE_X + index * STAGE_PITCH);
}

/**
 * The rotor of a centrifugal compressor: shaft, shrouded impellers with their hubs, a balance
 * piston at the discharge end and the journals the bearings run on.
 */
export function RotorBundle({ stages = 5, ...state }: RotorBundleProps) {
  const { steel, pipe, detail } = useEquipmentMaterials(state);

  return (
    <group>
      <AxialCylinder x={-4.45} y={SHAFT} radius={0.17} length={6.3} material={pipe} segments={14} />
      {impellerPositions(stages).map((x) => (
        <group key={x}>
          {/* Hub, widening from the eye to the disc */}
          <AxialCylinder x={x - 0.14} y={SHAFT} radius={0.34} radiusEnd={0.78} length={0.3} material={steel} segments={20} />
          {/* Disc and shroud */}
          <AxialCylinder x={x + 0.06} y={SHAFT} radius={1.02} length={0.1} material={detail} segments={28} />
          <AxialCylinder x={x - 0.2} y={SHAFT} radius={0.62} radiusEnd={1.02} length={0.16} material={detail} segments={28} />
        </group>
      ))}
      {/* Balance piston */}
      <AxialCylinder x={FIRST_STAGE_X + stages * STAGE_PITCH - 0.1} y={SHAFT} radius={0.6} length={0.36} material={steel} segments={20} />
      {/* Journals and thrust collar */}
      {[-7.1, -1.8].map((x) => (
        <AxialCylinder key={x} x={x} y={SHAFT} radius={0.24} length={0.5} material={detail} segments={14} />
      ))}
      <AxialCylinder x={-1.5} y={SHAFT} radius={0.4} length={0.08} material={steel} segments={18} />
    </group>
  );
}

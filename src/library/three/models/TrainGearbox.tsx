import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { AxialCylinder } from './AxialCylinder';
import { TRAIN_DECK_HEIGHT, TRAIN_SHAFT_HEIGHT } from './compressorTrainLayout';

export type TrainGearboxProps = EquipmentVisualState;

const SHAFT = TRAIN_SHAFT_HEIGHT;

/** The speed-increasing gearbox: split casing with a bolted joint, bearing caps, breather and the low-speed coupling guard. */
export function TrainGearbox(state: TrainGearboxProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials(state);

  return (
    <group>
      <mesh position={[1.3, SHAFT - 0.15, 0]} material={steel}>
        <boxGeometry args={[1.9, 2.5, 2.3]} />
      </mesh>
      {/* Split line */}
      <mesh position={[1.3, SHAFT, 0]} material={frame}>
        <boxGeometry args={[2.1, 0.14, 2.5]} />
      </mesh>
      {/* Cooling ribs */}
      {[-0.6, -0.2, 0.2, 0.6].map((offset) => (
        <mesh key={offset} position={[1.3 + offset, SHAFT + 0.62, 0]} material={frame}>
          <boxGeometry args={[0.08, 1, 2.36]} />
        </mesh>
      ))}
      {/* Bearing caps on both faces, high-speed pinion in front, bull gear offset behind */}
      {[0.3, 2.3].map((x) => (
        <group key={x}>
          <AxialCylinder x={x} y={SHAFT} radius={0.5} length={0.16} material={frame} segments={18} />
          <AxialCylinder x={x} y={SHAFT - 0.55} z={-0.55} radius={0.36} length={0.12} material={frame} segments={18} />
        </group>
      ))}
      {/* Breather and inspection cover */}
      <mesh position={[0.8, SHAFT + 1.25, 0.6]} material={pipe}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
      </mesh>
      <mesh position={[1.5, SHAFT + 1.13, -0.3]} material={detail}>
        <boxGeometry args={[0.8, 0.06, 0.8]} />
      </mesh>
      {/* Low-speed coupling guard towards the driver */}
      <AxialCylinder x={2.8} y={SHAFT} radius={0.46} length={0.84} material={pipe} segments={18} />
      <AxialCylinder x={3.2} y={SHAFT} radius={0.54} length={0.06} material={frame} segments={18} />
      {/* Sole plate */}
      <mesh position={[1.3, (TRAIN_DECK_HEIGHT + SHAFT - 1.4) / 2, 0]} material={frame}>
        <boxGeometry args={[2.2, SHAFT - 1.4 - TRAIN_DECK_HEIGHT, 2.6]} />
      </mesh>
    </group>
  );
}

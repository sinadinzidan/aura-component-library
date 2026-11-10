import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { TRAIN_DECK_HEIGHT } from './compressorTrainLayout';

export type TrainBaseFrameProps = EquipmentVisualState;

const CENTER_X = 1.1;
const LENGTH = 18.6;
const WIDTH = 5.2;
const CROSS_MEMBERS = [-7.6, -4.6, -1.6, 1.4, 4.4, 7.4, 10];

/** The base frame of the compressor train: two main beams, cross members and a deck plate. */
export function TrainBaseFrame(state: TrainBaseFrameProps) {
  const { frame, steel } = useEquipmentMaterials(state);
  const beam = TRAIN_DECK_HEIGHT - 0.1;

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[CENTER_X, beam / 2, side * (WIDTH / 2 - 0.2)]} material={frame}>
          <boxGeometry args={[LENGTH, beam, 0.4]} />
        </mesh>
      ))}
      {CROSS_MEMBERS.map((x) => (
        <mesh key={x} position={[x, beam / 2, 0]} material={frame}>
          <boxGeometry args={[0.3, beam * 0.8, WIDTH - 0.8]} />
        </mesh>
      ))}
      <mesh position={[CENTER_X, TRAIN_DECK_HEIGHT - 0.05, 0]} material={steel}>
        <boxGeometry args={[LENGTH, 0.1, WIDTH]} />
      </mesh>
      {/* Lifting lugs */}
      {[-7.4, 9.6].flatMap((x) =>
        [-1, 1].map((side) => (
          <mesh key={`${x}-${side}`} position={[x, 0.3, side * (WIDTH / 2 + 0.1)]} material={steel}>
            <boxGeometry args={[0.5, 0.36, 0.2]} />
          </mesh>
        ))
      )}
    </group>
  );
}

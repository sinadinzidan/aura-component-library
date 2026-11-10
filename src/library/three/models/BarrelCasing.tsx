import { DoubleSide } from 'three';

import type { EquipmentVisualState } from '../equipmentMaterials';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import { TRAIN_DECK_HEIGHT, TRAIN_SHAFT_HEIGHT } from './compressorTrainLayout';
import { SectionCut } from './SectionCut';

export type BarrelCasingProps = EquipmentVisualState & {
  /** Lifts the top half away so the rotor shows; the nozzles stay as ghosts to keep their position. */
  sectionCut?: boolean;
};

const SHAFT = TRAIN_SHAFT_HEIGHT;
const CENTER_X = -4.5;
const LENGTH = 4.2;
const RADIUS = 1.4;
const QUARTER_TURN = Math.PI / 2;
/** Suction at the non-drive end, discharge at the drive end. */
const NOZZLES = [-5.6, -3.4];
/** Stage partitions, between the five impellers. */
const DIAPHRAGMS = [-5.55, -4.85, -4.15, -3.45];

/**
 * The barrel casing of a centrifugal compressor: shell, end covers, suction and discharge nozzles
 * with flanges, and support feet. With `sectionCut` the top half is removed and the diaphragms
 * between the stages become visible.
 */
export function BarrelCasing({ sectionCut = false, ...state }: BarrelCasingProps) {
  const { steel, frame, pipe, detail } = useEquipmentMaterials(state);
  const ghost = useEquipmentMaterials({ dimmed: true });
  const nozzle = sectionCut ? ghost : { pipe, frame };
  const half = sectionCut ? ([RADIUS + 0.15, RADIUS + 0.15, 0.3, 14, 1, false, Math.PI, Math.PI] as const) : ([RADIUS + 0.15, RADIUS + 0.15, 0.3, 28] as const);

  return (
    <group>
      <group position={[CENTER_X, SHAFT, 0]}>
        <SectionCut radius={RADIUS} length={LENGTH} cut={sectionCut} material={steel} rimMaterial={detail} />
      </group>
      {/* End covers */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[CENTER_X + side * (LENGTH / 2 - 0.05), SHAFT, 0]} rotation={[0, 0, QUARTER_TURN]} material={frame}>
          <cylinderGeometry args={[...half]} />
        </mesh>
      ))}
      {sectionCut
        ? DIAPHRAGMS.map((x) => (
            <mesh key={x} position={[x, SHAFT, 0]} rotation={[0, 0, QUARTER_TURN]}>
              <cylinderGeometry args={[RADIUS - 0.04, RADIUS - 0.04, 0.07, 14, 1, false, Math.PI, Math.PI]} />
              <meshStandardMaterial color={frame.color} roughness={0.8} side={DoubleSide} transparent={frame.transparent} opacity={frame.opacity} />
            </mesh>
          ))
        : null}
      {/* Nozzles with weld-neck flanges */}
      {NOZZLES.map((x) => (
        <group key={x} position={[x, SHAFT + RADIUS - 0.1, 0]}>
          <mesh position={[0, 0.7, 0]} material={nozzle.pipe}>
            <cylinderGeometry args={[0.46, 0.52, 1.4, 18]} />
          </mesh>
          <mesh position={[0, 1.42, 0]} material={nozzle.frame}>
            <cylinderGeometry args={[0.7, 0.7, 0.16, 18]} />
          </mesh>
        </group>
      ))}
      {/* Nameplate */}
      {sectionCut ? null : (
        <mesh position={[CENTER_X, SHAFT + 0.5, RADIUS * 0.94]} rotation={[-0.36, 0, 0]} material={detail}>
          <boxGeometry args={[0.9, 0.45, 0.04]} />
        </mesh>
      )}
      {/* Support feet */}
      {[-5.9, -3.1].map((x) => (
        <mesh key={x} position={[x, (TRAIN_DECK_HEIGHT + SHAFT - 1) / 2, 0]} material={frame}>
          <boxGeometry args={[0.6, SHAFT - 1 - TRAIN_DECK_HEIGHT, 2.4]} />
        </mesh>
      ))}
    </group>
  );
}

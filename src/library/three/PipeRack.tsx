import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type PipeRackProps = Omit<EquipmentProps, 'tone' | 'pulse' | 'selected' | 'hovered'> & {
  /** Length along x. */
  length?: number;
  width?: number;
  height?: number;
  /** Distance between portal frames. */
  bay?: number;
  /** Pipes carried on each of the two levels. */
  pipes?: number;
};

const HALF_TURN = Math.PI / 2;

/** A two-level pipe rack: portal frames carrying parallel lines. The spine most plants are laid out along. */
export function PipeRack({ length = 40, width = 4, height = 5, bay = 8, pipes = 4, dimmed, ...base }: PipeRackProps) {
  const { frame, pipe } = useEquipmentMaterials({ dimmed });
  const frames = Math.max(2, Math.round(length / bay) + 1);
  const xs = Array.from({ length: frames }, (_, index) => -length / 2 + (length / (frames - 1)) * index);
  const levels = [height * 0.62, height];
  const lanes = Array.from({ length: pipes }, (_, index) => -width / 2 + (width / (pipes + 1)) * (index + 1));

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={0}>
      {xs.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[0, height / 2, (side * width) / 2]} material={frame}>
              <boxGeometry args={[0.28, height, 0.28]} />
            </mesh>
          ))}
          {levels.map((level) => (
            <mesh key={level} position={[0, level, 0]} material={frame}>
              <boxGeometry args={[0.24, 0.24, width + 0.28]} />
            </mesh>
          ))}
        </group>
      ))}
      {levels.map((level, levelIndex) =>
        lanes.map((lane, laneIndex) => {
          const radius = 0.14 + ((laneIndex + levelIndex) % 3) * 0.05;
          return (
            <mesh key={`${level}-${lane}`} position={[0, level + 0.12 + radius, lane]} rotation={[0, 0, HALF_TURN]} material={pipe}>
              <cylinderGeometry args={[radius, radius, length, 10]} />
            </mesh>
          );
        })
      )}
    </EquipmentBase>
  );
}

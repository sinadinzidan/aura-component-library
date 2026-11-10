import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type ColumnProps = EquipmentProps & {
  height?: number;
  diameter?: number;
  /** Number of access platforms spread up the column. */
  platforms?: number;
};

/** A tall process column with platforms, a ladder and an overhead line: contactors, strippers, fractionators. */
export function Column({ height = 22, diameter = 2.4, platforms = 3, hovered, selected, dimmed, ...base }: ColumnProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = diameter / 2;
  const skirt = 2;
  const head = radius * 0.5;
  const shell = height - skirt - head;
  const levels = Array.from({ length: platforms }, (_, index) => skirt + (shell * (index + 1)) / (platforms + 0.5));

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={radius + 1.4}>
      <mesh position={[0, skirt / 2, 0]} material={frame}>
        <cylinderGeometry args={[radius * 0.95, radius * 1.1, skirt, 24]} />
      </mesh>
      <mesh position={[0, skirt + shell / 2, 0]} material={steel}>
        <cylinderGeometry args={[radius, radius, shell, 28]} />
      </mesh>
      <mesh position={[0, skirt + shell, 0]} scale={[1, head / radius, 1]} material={steel}>
        <sphereGeometry args={[radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {levels.map((level) => (
        <mesh key={level} position={[0, level, 0]} material={frame}>
          <cylinderGeometry args={[radius + 0.9, radius + 0.9, 0.12, 24]} />
        </mesh>
      ))}
      {/* Ladder */}
      <mesh position={[0, skirt + shell / 2, radius + 0.25]} material={frame}>
        <boxGeometry args={[0.5, shell, 0.08]} />
      </mesh>
      {/* Overhead line down the side */}
      <mesh position={[0, height + 0.25, 0]} material={pipe}>
        <cylinderGeometry args={[0.2, 0.2, 0.8, 12]} />
      </mesh>
      <mesh position={[-radius - 0.5, skirt + shell / 2 + 0.6, 0]} material={pipe}>
        <cylinderGeometry args={[0.16, 0.16, shell - 1, 10]} />
      </mesh>
    </EquipmentBase>
  );
}

import { DoubleSide } from 'three';

import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useSceneEnvironment } from './sceneEnvironment';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type StorageTankProps = EquipmentProps & {
  diameter?: number;
  /** Shell height, roof excluded. */
  height?: number;
  /** Fill level, 0 (empty) to 1 (full). The liquid is visible through the shell. */
  fill?: number;
};

/**
 * An atmospheric storage tank whose shell is see-through, so the liquid level inside is the thing
 * you read. Rim rings keep the tank's outline solid.
 */
export function StorageTank({ diameter = 10, height = 8, fill = 0.5, hovered, selected, dimmed, ...base }: StorageTankProps) {
  const { palette } = useSceneEnvironment();
  const { frame, steel } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = diameter / 2;
  const level = Math.min(1, Math.max(0, fill)) * (height - 0.2);
  const fade = dimmed ? 0.3 : 1;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={radius + 1}>
      {level > 0.01 ? (
        <mesh position={[0, 0.1 + level / 2, 0]}>
          <cylinderGeometry args={[radius * 0.97, radius * 0.97, level, 40]} />
          <meshStandardMaterial color={palette.liquid.color} transparent opacity={palette.liquid.opacity * 0.8 * fade} roughness={0.3} depthWrite={false} />
        </mesh>
      ) : null}
      <mesh position={[0, height / 2, 0]} renderOrder={1}>
        <cylinderGeometry args={[radius, radius, height, 40, 1, true]} />
        <meshStandardMaterial color={palette.steel.color} transparent opacity={0.28 * fade} roughness={0.6} side={DoubleSide} depthWrite={false} />
      </mesh>
      {[0.06, height * 0.5, height].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={y === height * 0.5 ? frame : steel}>
          <torusGeometry args={[radius, y === height * 0.5 ? 0.06 : 0.12, 8, 48]} />
        </mesh>
      ))}
      <mesh position={[0, height + radius * 0.09, 0]} renderOrder={2}>
        <coneGeometry args={[radius, radius * 0.18, 40, 1, true]} />
        <meshStandardMaterial color={palette.steel.color} transparent opacity={0.45 * fade} roughness={0.6} side={DoubleSide} depthWrite={false} />
      </mesh>
      {/* Stair tower */}
      <mesh position={[radius + 0.35, height / 2, 0]} material={frame}>
        <boxGeometry args={[0.5, height, 0.9]} />
      </mesh>
    </EquipmentBase>
  );
}

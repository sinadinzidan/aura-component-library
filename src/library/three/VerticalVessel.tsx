import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type VerticalVesselProps = EquipmentProps & {
  /** Overall height, skirt and head included. */
  height?: number;
  diameter?: number;
};

/** A vertical vessel on a skirt with a domed head: scrubbers, knock-out drums, filters. */
export function VerticalVessel({ height = 8, diameter = 2.8, hovered, selected, dimmed, ...base }: VerticalVesselProps) {
  const { steel, frame, pipe } = useEquipmentMaterials({ hovered, selected, dimmed });
  const radius = diameter / 2;
  const skirt = Math.min(1.4, height * 0.18);
  const head = radius * 0.5;
  const shell = height - skirt - head;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={radius + 0.9}>
      <mesh position={[0, skirt / 2, 0]} material={frame}>
        <cylinderGeometry args={[radius * 0.92, radius, skirt, 24]} />
      </mesh>
      <mesh position={[0, skirt + shell / 2, 0]} material={steel}>
        <cylinderGeometry args={[radius, radius, shell, 28]} />
      </mesh>
      <mesh position={[0, skirt + shell, 0]} scale={[1, head / radius, 1]} material={steel}>
        <sphereGeometry args={[radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Top outlet */}
      <mesh position={[0, height + 0.15, 0]} material={pipe}>
        <cylinderGeometry args={[0.2, 0.2, 0.6, 12]} />
      </mesh>
      {/* Side inlet */}
      <mesh position={[-radius - 0.25, skirt + shell * 0.55, 0]} rotation={[0, 0, Math.PI / 2]} material={pipe}>
        <cylinderGeometry args={[0.22, 0.22, 0.7, 12]} />
      </mesh>
      {/* Level bridle */}
      <mesh position={[radius + 0.3, skirt + shell * 0.4, 0]} material={pipe}>
        <cylinderGeometry args={[0.08, 0.08, shell * 0.5, 8]} />
      </mesh>
    </EquipmentBase>
  );
}

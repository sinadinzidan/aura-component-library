import type { Vec3 } from './cameraTargets';
import { EquipmentBase } from './EquipmentBase';
import type { EquipmentProps } from './equipmentProps';
import { useSceneEnvironment } from './sceneEnvironment';
import { useEquipmentMaterials } from './useEquipmentMaterials';

export type BuildingProps = EquipmentProps & {
  /** Width (x), height and depth (z). */
  size?: Vec3;
  /** `control-room` adds a lit window band and a roof mast; `plain` is a shelter or substation. */
  variant?: 'plain' | 'control-room';
};

/** A simple block building: local equipment rooms, substations, or the control room with its window band. */
export function Building({ size = [12, 4.5, 8], variant = 'plain', hovered, selected, dimmed, ...base }: BuildingProps) {
  const { palette } = useSceneEnvironment();
  const { steel, frame } = useEquipmentMaterials({ hovered, selected, dimmed });
  const [width, height, depth] = size;
  const body = height - 0.3;

  return (
    <EquipmentBase {...base} dimmed={dimmed} beaconRadius={Math.hypot(width, depth) / 2 + 0.6}>
      <mesh position={[0, body / 2, 0]} material={steel}>
        <boxGeometry args={[width, body, depth]} />
      </mesh>
      <mesh position={[0, body + 0.15, 0]} material={frame}>
        <boxGeometry args={[width + 0.5, 0.3, depth + 0.5]} />
      </mesh>
      <mesh position={[-width * 0.3, 1.1, depth / 2 + 0.03]} material={frame}>
        <boxGeometry args={[1.1, 2.2, 0.06]} />
      </mesh>
      {variant === 'control-room' ? (
        <>
          <mesh position={[width * 0.12, body * 0.62, depth / 2 + 0.03]}>
            <boxGeometry args={[width * 0.5, body * 0.26, 0.06]} />
            <meshBasicMaterial color={palette.accent.color} transparent opacity={dimmed ? 0.2 : 0.85} />
          </mesh>
          <mesh position={[width * 0.34, height + 1.6, -depth * 0.25]} material={frame}>
            <cylinderGeometry args={[0.06, 0.08, 3.2, 6]} />
          </mesh>
        </>
      ) : null}
    </EquipmentBase>
  );
}

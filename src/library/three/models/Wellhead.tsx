import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type WellheadKind = 'producer' | 'injector';

export type WellheadProps = {
  /** Where the well leaves the seabed. */
  position: Vec3;
  kind: WellheadKind;
  /** Resolved colour of the well type. */
  color: string;
  selected?: boolean;
  dimmed?: boolean;
  /** Overall size multiplier. */
  size?: number;
};

/**
 * A wellhead marker whose shape says what the well does: a producer carries a cone pointing up
 * (flow comes out), an injector a cone pointing down (flow goes in). Colour repeats the type, so
 * it reads with or without colour vision.
 */
export function Wellhead({ position, kind, color, selected = false, dimmed = false, size = 1 }: WellheadProps) {
  const { frame } = useEquipmentMaterials({ dimmed });
  const up = kind === 'producer';

  return (
    <group position={toTuple(position)} scale={size * (selected ? 1.25 : 1)}>
      <mesh position={[0, 0.2, 0]} material={frame}>
        <cylinderGeometry args={[0.16, 0.2, 0.4, 10]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} rotation={[up ? 0 : Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 0.7, up ? 12 : 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.9 : 0.4}
          transparent={dimmed}
          opacity={dimmed ? 0.2 : 1}
          depthWrite={!dimmed}
        />
      </mesh>
    </group>
  );
}

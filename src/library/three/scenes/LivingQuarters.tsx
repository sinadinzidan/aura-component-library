import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

export type LivingQuartersProps = {
  position?: Vec3;
  /** Width (x), height and depth (z). */
  size?: Vec3;
  storeys?: number;
  dimmed?: boolean;
};

/**
 * The living quarters of a platform: an accommodation block with a lit window band per storey on
 * its two long faces. A helideck usually sits on its roof.
 */
export function LivingQuarters({ position = [0, 0, 0], size = [10, 10, 18], storeys = 3, dimmed = false }: LivingQuartersProps) {
  const { palette } = useSceneEnvironment();
  const { steel, frame } = useEquipmentMaterials({ dimmed });
  const [width, height, depth] = size;
  const count = Math.max(1, Math.round(storeys));
  const storey = height / count;

  return (
    <group position={toTuple(position)}>
      <mesh position={[0, height / 2, 0]} material={steel}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh position={[0, height + 0.15, 0]} material={frame}>
        <boxGeometry args={[width + 0.6, 0.3, depth + 0.6]} />
      </mesh>
      {Array.from({ length: count }, (_, level) =>
        [-1, 1].map((side) => (
          <mesh key={`${level}${side}`} position={[side * (width / 2 + 0.03), storey * (level + 0.6), 0]}>
            <boxGeometry args={[0.06, storey * 0.28, depth * 0.84]} />
            <meshBasicMaterial color={palette.accent.color} transparent opacity={dimmed ? 0.15 : 0.8} depthWrite={!dimmed} />
          </mesh>
        ))
      )}
    </group>
  );
}

import { useSceneEnvironment } from '../sceneEnvironment';
import { useEquipmentMaterials } from '../useEquipmentMaterials';

import type { GroundRect } from './tankFarmLayout';

export type BundWallProps = {
  /** The rectangle the wall encloses. See `bundRect`. */
  rect: GroundRect;
  height?: number;
  thickness?: number;
  dimmed?: boolean;
};

/** A bund: the low containment wall around a row of tanks, with a faintly tinted floor inside it. */
export function BundWall({ rect, height = 1.4, thickness = 0.5, dimmed = false }: BundWallProps) {
  const { palette } = useSceneEnvironment();
  const { frame } = useEquipmentMaterials({ dimmed });
  const [width, depth] = rect.size;

  return (
    <group position={[rect.center[0], 0, rect.center[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={palette.frame.color} transparent opacity={dimmed ? 0.05 : 0.18} depthWrite={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`x${side}`} position={[0, height / 2, (side * depth) / 2]} material={frame}>
          <boxGeometry args={[width + thickness, height, thickness]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`z${side}`} position={[(side * width) / 2, height / 2, 0]} material={frame}>
          <boxGeometry args={[thickness, height, depth - thickness]} />
        </mesh>
      ))}
    </group>
  );
}

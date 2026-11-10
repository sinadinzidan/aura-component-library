import { Line } from '@react-three/drei';
import { DoubleSide } from 'three';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

export type DepthPlaneProps = {
  /** Height of the plane in scene units: negative below the seabed. */
  y: number;
  /** Half the width of the plane. */
  halfExtent: number;
  /** Points where wells cross the plane; each gets a ring. */
  marks?: readonly { id: string; position: Vec3; emphasized?: boolean }[];
  markRadius?: number;
};

/**
 * A horizontal cutting plane through a subsurface block: a faint sheet with a bright frame at the
 * chosen depth, and a ring wherever a well crosses it. Move it with a depth slider to read the
 * block level by level.
 */
export function DepthPlane({ y, halfExtent, marks = [], markRadius = 0.28 }: DepthPlaneProps) {
  const { palette } = useSceneEnvironment();
  const h = halfExtent;
  const frame: [number, number, number][] = [
    [-h, 0, -h],
    [h, 0, -h],
    [h, 0, h],
    [-h, 0, h],
    [-h, 0, -h],
  ];

  return (
    <group>
      <group position={[0, y, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[h * 2, h * 2]} />
          <meshBasicMaterial color={palette.accent.color} transparent opacity={0.09} side={DoubleSide} depthWrite={false} />
        </mesh>
        <Line points={frame} color={palette.accent.color} lineWidth={1.5} />
      </group>
      {marks.map((mark) => (
        <mesh key={mark.id} position={toTuple(mark.position)} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
          <ringGeometry args={[markRadius * (mark.emphasized ? 1.1 : 0.8), markRadius * (mark.emphasized ? 1.6 : 1.15), 24]} />
          <meshBasicMaterial color={palette.highlight.color} transparent opacity={mark.emphasized ? 1 : 0.85} side={DoubleSide} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

import { useEffect, useMemo } from 'react';
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from 'three';

import { useSceneEnvironment } from '../sceneEnvironment';

export type SeaPlaneProps = {
  /** Width (x) and depth (z). */
  size?: readonly [number, number];
  /** Centre on the horizontal plane: x, z. */
  center?: readonly [number, number];
  /** Height of the water surface. */
  level?: number;
  /** Distance between the swell lines drawn on the surface. 0 draws none. */
  cell?: number;
  /** How see-through the water is, 0–1. Structure below the surface stays visible through it. */
  opacity?: number;
  /** Called when the open water is clicked. */
  onClick?: () => void;
};

/**
 * A translucent sea surface in the theme's liquid colour with a quiet line grid, so jacket legs,
 * piles and hulls can be seen continuing below the waterline.
 */
export function SeaPlane({ size = [160, 160], center = [0, 0], level = 0, cell = 8, opacity = 0.3, onClick }: SeaPlaneProps) {
  const { palette } = useSceneEnvironment();
  const [width, depth] = size;
  const lines = useMemo(() => {
    const vertices: number[] = [];
    if (cell > 0) {
      for (let x = -width / 2; x <= width / 2 + 1e-6; x += cell) vertices.push(x, 0, -depth / 2, x, 0, depth / 2);
      for (let z = -depth / 2; z <= depth / 2 + 1e-6; z += cell) vertices.push(-width / 2, 0, z, width / 2, 0, z);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [width, depth, cell]);
  useEffect(() => () => lines.dispose(), [lines]);

  return (
    <group position={[center[0], level, center[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={onClick} renderOrder={3}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={palette.liquid.color} transparent opacity={opacity * palette.liquid.opacity} roughness={0.35} side={DoubleSide} depthWrite={false} />
      </mesh>
      {cell > 0 ? (
        <lineSegments geometry={lines} position={[0, 0.02, 0]} renderOrder={4}>
          <lineBasicMaterial color={palette.outline.color} transparent opacity={0.28} depthWrite={false} />
        </lineSegments>
      ) : null}
    </group>
  );
}

import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';

import { useSceneEnvironment } from './sceneEnvironment';

export type GroundProps = {
  /** Width (x) and depth (z) of the plot, in scene units. */
  size?: [number, number];
  /** Grid spacing. */
  cell?: number;
  /** Every n-th line is drawn stronger. */
  majorEvery?: number;
  /** Centre of the plot on the ground plane. */
  center?: [number, number];
  /** Called when the bare ground is clicked. */
  onClick?: () => void;
};

function gridGeometry(size: [number, number], cell: number, pick: (index: number) => boolean): BufferGeometry {
  const [width, depth] = size;
  const vertices: number[] = [];
  const columns = Math.round(width / cell);
  const rows = Math.round(depth / cell);
  for (let column = 0; column <= columns; column += 1) {
    if (!pick(column)) continue;
    const x = -width / 2 + column * cell;
    vertices.push(x, 0, -depth / 2, x, 0, depth / 2);
  }
  for (let row = 0; row <= rows; row += 1) {
    if (!pick(row)) continue;
    const z = -depth / 2 + row * cell;
    vertices.push(-width / 2, 0, z, width / 2, 0, z);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  return geometry;
}

/**
 * The plot plan: a floor in the theme's card colour with a quiet two-level grid. It gives the
 * scene scale and a horizon without competing with the equipment standing on it.
 */
export function Ground({ size = [120, 80], cell = 4, majorEvery = 5, center = [0, 0], onClick }: GroundProps) {
  const { palette } = useSceneEnvironment();
  const [width, depth] = size;
  const minor = useMemo(() => gridGeometry([width, depth], cell, (index) => index % majorEvery !== 0), [width, depth, cell, majorEvery]);
  const major = useMemo(() => gridGeometry([width, depth], cell, (index) => index % majorEvery === 0), [width, depth, cell, majorEvery]);

  return (
    <group position={[center[0], 0, center[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} onClick={onClick} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={palette.ground.color} roughness={1} metalness={0} />
      </mesh>
      <lineSegments geometry={minor} position={[0, 0.01, 0]}>
        <lineBasicMaterial color={palette.line.color} transparent opacity={0.7} />
      </lineSegments>
      <lineSegments geometry={major} position={[0, 0.015, 0]}>
        <lineBasicMaterial color={palette.frame.color} />
      </lineSegments>
    </group>
  );
}

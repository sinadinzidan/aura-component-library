import { useEffect, useMemo } from 'react';
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from 'three';

import { useSceneEnvironment } from '../sceneEnvironment';

import { terrainGrid } from './terrainHeight';
import type { HeightFunction } from './terrainHeight';

export type SeabedTerrainProps = {
  /** Ground level at a point on the plan, e.g. `(x, z) => terrainHeight(spec, x, z)`. */
  height: HeightFunction;
  /** Width (x) and depth (z) of the mapped ground. */
  size: readonly [number, number];
  /** Cells along x and z. Low on purpose: the facets are the look. */
  segments?: readonly [number, number];
  /** Centre on the plan: x, z. */
  center?: readonly [number, number];
  /** Strength of the mesh drawn over the facets, 0–1. */
  wire?: number;
  /** Called when the bare ground is clicked. */
  onClick?: () => void;
};

/**
 * Low-poly ground: flat-shaded facets in the theme's floor colour with a quiet mesh over them.
 * The same height function drapes pipelines on it, so lines never float or sink.
 */
export function SeabedTerrain({ height, size, segments = [46, 36], center = [0, 0], wire = 0.32, onClick }: SeabedTerrainProps) {
  const { palette } = useSceneEnvironment();
  const geometry = useMemo(() => {
    const grid = terrainGrid(height, size, segments, center);
    const built = new BufferGeometry();
    built.setAttribute('position', new Float32BufferAttribute(grid.positions, 3));
    built.setIndex(grid.indices);
    built.computeVertexNormals();
    return built;
  }, [height, size, segments, center]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} onClick={onClick} receiveShadow>
        <meshStandardMaterial color={palette.frame.color} flatShading roughness={1} metalness={0} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometry} position={[0, 0.03, 0]}>
        <meshBasicMaterial color={palette.outline.color} wireframe transparent opacity={wire} depthWrite={false} />
      </mesh>
    </group>
  );
}

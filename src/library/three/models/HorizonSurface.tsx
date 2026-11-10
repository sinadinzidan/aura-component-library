import { useEffect, useMemo } from 'react';
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from 'three';

import { horizonDepthAt } from './horizonHeight';
import type { Horizon } from './horizonHeight';

export type HorizonSurfaceProps = {
  horizon: Horizon;
  /** Half the width of the mapped square, in metres. */
  halfExtent: number;
  /** Scene units per metre. */
  scale: number;
  /** Cells per side. Low on purpose: the facets are the look. */
  segments?: number;
  /** Resolved colour of the horizon. */
  color: string;
  opacity?: number;
};

/** The low-poly grid of a horizon, in scene coordinates: east is +x, north is −z, depth is −y. */
export function horizonGeometry(horizon: Horizon, halfExtent: number, scale: number, segments: number): BufferGeometry {
  const cells = Math.max(1, Math.floor(segments));
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= cells; row += 1) {
    for (let column = 0; column <= cells; column += 1) {
      const east = -halfExtent + (column / cells) * halfExtent * 2;
      const north = halfExtent - (row / cells) * halfExtent * 2;
      positions.push(east * scale, -horizonDepthAt(horizon, east, north) * scale, -north * scale);
    }
  }
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const a = row * (cells + 1) + column;
      const b = a + 1;
      const c = a + cells + 1;
      indices.push(a, c, b, b, c, c + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A stratigraphic horizon as a large, semi-transparent, faceted surface with its mesh drawn on
 * top. The shape comes from `horizonDepthAt`, so it is the same on every render and agrees with
 * what `formationAt` reports for a well.
 */
export function HorizonSurface({ horizon, halfExtent, scale, segments = 12, color, opacity = 0.2 }: HorizonSurfaceProps) {
  const geometry = useMemo(() => horizonGeometry(horizon, halfExtent, scale, segments), [horizon, halfExtent, scale, segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={color} flatShading transparent opacity={opacity} side={DoubleSide} depthWrite={false} roughness={0.9} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} wireframe transparent opacity={Math.min(1, opacity * 1.6)} depthWrite={false} />
      </mesh>
    </group>
  );
}

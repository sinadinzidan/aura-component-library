import { BufferGeometry, Float32BufferAttribute } from 'three';

import { horizonDepthAt } from './horizonHeight';
import type { Horizon } from './horizonHeight';

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

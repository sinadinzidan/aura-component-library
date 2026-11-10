import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';

import { horizonGeometry } from './horizonGeometry';
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

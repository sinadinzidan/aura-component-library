import { useEffect, useMemo } from 'react';
import { BackSide, BufferGeometry, Float32BufferAttribute } from 'three';

import { useSceneEnvironment } from '../sceneEnvironment';

import type { Outline } from './continents';
import { densifyPolyline, graticuleSegments, latLongToVec3 } from './geo';

export type GlobeProps = {
  radius?: number;
  /** Coastlines to draw. See `WORLD_OUTLINES`. */
  outlines?: readonly Outline[];
  /** Degrees between parallels and between meridians of the grid. 0 draws no grid. */
  graticuleStep?: number;
  /** A faint glow around the limb. */
  halo?: boolean;
  /** Called when the bare globe is clicked. */
  onClick?: () => void;
};

function segmentGeometry(vertices: number[]): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  return geometry;
}

/**
 * A stylised globe: a dark sphere in the theme's surface colour, a latitude/longitude graticule
 * and coastlines drawn as line loops. No textures and no map files — the outlines are a small set
 * of hand-authored polylines, densified so they hug the sphere. North is +y; see `latLongToVec3`.
 */
export function Globe({ radius = 10, outlines = [], graticuleStep = 15, halo = true, onClick }: GlobeProps) {
  const { palette } = useSceneEnvironment();
  const grid = useMemo(() => segmentGeometry(graticuleStep > 0 ? graticuleSegments(radius * 1.002, graticuleStep, graticuleStep, 5) : []), [radius, graticuleStep]);
  const coasts = useMemo(() => {
    const vertices: number[] = [];
    outlines.forEach((outline) => {
      const dense = densifyPolyline(outline.points, 3, outline.closed);
      const count = outline.closed ? dense.length : dense.length - 1;
      for (let index = 0; index < count; index += 1) {
        const from = dense[index];
        const to = dense[(index + 1) % dense.length];
        vertices.push(...latLongToVec3(from.lat, from.lon, radius * 1.004), ...latLongToVec3(to.lat, to.lon, radius * 1.004));
      }
    });
    return segmentGeometry(vertices);
  }, [outlines, radius]);
  useEffect(() => () => grid.dispose(), [grid]);
  useEffect(() => () => coasts.dispose(), [coasts]);

  return (
    <group>
      <mesh onClick={onClick}>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshStandardMaterial color={palette.ground.color} roughness={0.95} metalness={0} />
      </mesh>
      {halo ? (
        <mesh scale={1.06}>
          <sphereGeometry args={[radius, 48, 32]} />
          <meshBasicMaterial color={palette.accent.color} transparent opacity={0.1} side={BackSide} depthWrite={false} />
        </mesh>
      ) : null}
      <lineSegments geometry={grid} name="graticule">
        <lineBasicMaterial color={palette.frame.color} transparent opacity={0.55} />
      </lineSegments>
      <lineSegments geometry={coasts} name="coastlines">
        <lineBasicMaterial color={palette.accent.color} transparent opacity={0.9} />
      </lineSegments>
    </group>
  );
}

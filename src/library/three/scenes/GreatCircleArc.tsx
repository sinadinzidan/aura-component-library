import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';

import { toTuple } from '../cameraTargets';
import { pointAlong, polylineLength } from '../pipeGeometry';
import { useSceneEnvironment } from '../sceneEnvironment';
import type { SceneTone } from '../scenePalette';

import { greatCircleArc } from './geo';
import type { LatLong } from './geo';

export type GreatCircleArcProps = {
  from: LatLong;
  to: LatLong;
  /** Radius of the globe the arc spans. */
  globeRadius?: number;
  /** Line width in pixels. */
  width?: number;
  /** Colour: the accent by default, a status tone for a route in that state. */
  tone?: SceneTone;
  /** A quieter line, for secondary routes. */
  quiet?: boolean;
  /** A bead travelling from `from` to `to`, showing direction. Holds at the start under reduced motion. */
  flow?: boolean;
  /** Seconds the bead takes for one trip. */
  period?: number;
  dimmed?: boolean;
};

/**
 * A route between two places on a globe: it follows the great circle and lifts off the surface in
 * the middle, higher for longer hops. An optional bead travels along it to show which way it runs.
 */
export function GreatCircleArc({ from, to, globeRadius = 10, width = 1.5, tone, quiet = false, flow = false, period = 4, dimmed = false }: GreatCircleArcProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const bead = useRef<Mesh>(null);
  const points = useMemo(() => greatCircleArc(from, to, { radius: globeRadius * 1.006, segments: 40 }), [from, to, globeRadius]);
  const tuples = useMemo(() => points.map(toTuple), [points]);
  const total = useMemo(() => polylineLength(points), [points]);
  const color = palette[tone ?? 'accent'].color;
  const opacity = dimmed ? 0.12 : quiet ? 0.4 : 0.95;
  const animate = flow && !reducedMotion && !dimmed && period > 0;

  useFrame((state) => {
    if (!flow || !bead.current) return;
    const phase = animate ? (state.clock.elapsedTime % period) / period : 0.5;
    const sample = pointAlong(points, total * phase);
    if (sample) bead.current.position.set(sample.position[0], sample.position[1], sample.position[2]);
    if (animate) state.invalidate();
  });

  return (
    <group>
      <Line points={tuples} color={color} lineWidth={width} transparent opacity={opacity} depthWrite={false} />
      {flow ? (
        <mesh ref={bead} position={tuples[Math.floor(tuples.length / 2)]}>
          <sphereGeometry args={[globeRadius * 0.008, 10, 8]} />
          <meshBasicMaterial color={palette.highlight.color} transparent opacity={dimmed ? 0.15 : 1} />
        </mesh>
      ) : null}
    </group>
  );
}

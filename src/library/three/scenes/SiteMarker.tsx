import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Quaternion, Vector3 } from 'three';
import type { Group, Mesh, MeshBasicMaterial } from 'three';

import { toTuple } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import type { SceneTone } from '../scenePalette';

import { latLongToVec3 } from './geo';

export type SiteMarkerProps = {
  lat: number;
  lon: number;
  /** Radius of the globe the marker sits on. */
  globeRadius?: number;
  /** Radius of the marker dot when the camera is about 1.2 globe radii away. Size it by a value with `markerRadius`. */
  size?: number;
  /** Keep the marker about the same size on screen at any zoom, so it stays visible from afar and small up close. */
  constantSize?: boolean;
  /** Status of the site. Without one the marker takes the accent colour. */
  tone?: SceneTone;
  /** `diamond` marks a different kind of place, such as a terminal among platforms. */
  shape?: 'dot' | 'diamond';
  /** Slow expanding halo. Stops under reduced motion. */
  pulse?: boolean;
  hovered?: boolean;
  selected?: boolean;
  /** Fade the marker back, for sites outside the active filter. */
  dimmed?: boolean;
};

const UP = new Vector3(0, 0, 1);

/**
 * A glowing marker on a globe: a dot lying on the surface with a soft disc and a ring around it,
 * coloured by status and sized by a value. Always pair it with a list or label that names the
 * site and says its status in words.
 */
export function SiteMarker({ lat, lon, globeRadius = 10, size = 0.2, tone, shape = 'dot', constantSize = true, pulse = false, hovered = false, selected = false, dimmed = false }: SiteMarkerProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const root = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const haloMaterial = useRef<MeshBasicMaterial>(null);
  const position = useMemo(() => latLongToVec3(lat, lon, globeRadius * 1.008), [lat, lon, globeRadius]);
  const quaternion = useMemo(() => {
    const normal = new Vector3(position[0], position[1], position[2]).normalize();
    const q = new Quaternion().setFromUnitVectors(UP, normal);
    return [q.x, q.y, q.z, q.w] as const;
  }, [position]);
  const color = palette[tone ?? 'accent'].color;
  const fade = dimmed ? 0.22 : 1;
  const emphasis = hovered || selected ? 1.35 : 1;
  const animate = pulse && !reducedMotion && !dimmed;

  useFrame((state) => {
    if (root.current) {
      const distance = state.camera.position.distanceTo(root.current.position);
      const zoom = constantSize ? Math.max(0.4, distance / (globeRadius * 1.2)) ** 0.85 : 1;
      root.current.scale.setScalar(zoom * emphasis);
    }
    if (!animate || !halo.current || !haloMaterial.current) return;
    const phase = (state.clock.elapsedTime % 2.6) / 2.6;
    const grow = 1 + phase * 1.1;
    halo.current.scale.set(grow, grow, 1);
    haloMaterial.current.opacity = 0.7 * (1 - phase);
    state.invalidate();
  });

  return (
    <group ref={root} position={toTuple(position)} quaternion={[quaternion[0], quaternion[1], quaternion[2], quaternion[3]]}>
      <mesh renderOrder={5}>
        <circleGeometry args={[size * 2.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2 * fade} depthWrite={false} />
      </mesh>
      <mesh ref={halo} renderOrder={6}>
        <ringGeometry args={[size * 1.5, size * 1.75, 40]} />
        <meshBasicMaterial ref={haloMaterial} color={color} transparent opacity={(selected ? 1 : 0.7) * fade} depthWrite={false} />
      </mesh>
      <mesh renderOrder={7} rotation={[0, 0, shape === 'diamond' ? Math.PI / 4 : 0]} position={[0, 0, 0.01]}>
        <circleGeometry args={[size, shape === 'diamond' ? 4 : 24]} />
        <meshBasicMaterial color={color} transparent opacity={fade} depthWrite={false} />
      </mesh>
      {selected ? (
        <mesh renderOrder={6}>
          <ringGeometry args={[size * 2.4, size * 2.62, 48]} />
          <meshBasicMaterial color={palette.highlight.color} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

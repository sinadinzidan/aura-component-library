import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';

import { toTuple } from './cameraTargets';
import type { Vec3 } from './cameraTargets';
import { useSceneEnvironment } from './sceneEnvironment';
import type { SceneTone } from './scenePalette';

export type SensorMarkerProps = {
  /** Where the instrument sits, in scene coordinates. */
  position: Vec3;
  /** Status of the reading. Without one the marker takes the accent colour. */
  tone?: SceneTone;
  /** Radius of the marker ball. */
  size?: number;
};

/**
 * Marks where one instrument sits on a machine: a bright ball with an expanding halo, drawn on
 * top of the model so it is never buried inside it. Pair it with a `SceneLabel` carrying the tag.
 */
export function SensorMarker({ position, tone, size = 0.28 }: SensorMarkerProps) {
  const { palette, reducedMotion } = useSceneEnvironment();
  const halo = useRef<Mesh>(null);
  const haloMaterial = useRef<MeshBasicMaterial>(null);
  const color = palette[tone ?? 'accent'].color;

  useFrame((state) => {
    if (!halo.current) return;
    halo.current.quaternion.copy(state.camera.quaternion);
    if (reducedMotion || !haloMaterial.current) return;
    const phase = (state.clock.elapsedTime % 1.8) / 1.8;
    const scale = 1 + phase * 1.6;
    halo.current.scale.set(scale, scale, scale);
    haloMaterial.current.opacity = 0.7 * (1 - phase);
    state.invalidate();
  });

  return (
    <group position={toTuple(position)}>
      <mesh renderOrder={10}>
        <sphereGeometry args={[size, 16, 12]} />
        <meshBasicMaterial color={color} depthTest={false} transparent />
      </mesh>
      <mesh ref={halo} renderOrder={9}>
        <ringGeometry args={[size * 1.5, size * 1.9, 32]} />
        <meshBasicMaterial ref={haloMaterial} color={color} depthTest={false} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Matrix4 } from 'three';
import type { InstancedMesh } from 'three';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { chevronDistances, pointAlong, polylineLength, quaternionFromY } from '../pipeGeometry';
import { useSceneEnvironment } from '../sceneEnvironment';

import { particleCount, particlePositions } from './particlePositions';
import type { ParticleOptions } from './particlePositions';

export type FlowParticlesProps = {
  /** The line's route, corner to corner, in flow direction. */
  route: readonly Vec3[];
  /** Flow as a 0–1 share of the scene's reference flow. 0 draws nothing. */
  rate: number;
  /** A resolved token colour for the fluid. */
  color: string;
  opacity?: number;
  /** Particle radius. */
  size?: number;
  /**
   * Hold the stream at this time (seconds) instead of animating it: for stills, tests and
   * scrubbing by hand. Without it the stream runs on the scene clock.
   */
  time?: number;
  /** Distance between the static chevrons that replace the stream under reduced motion. */
  chevronSpacing?: number;
  options?: ParticleOptions;
};

const SCRATCH = new Matrix4();

/**
 * A stream of small particles moving along a line: one instanced mesh whose positions come from
 * `particlePositions`, so speed and density both follow the flow rate. Under reduced motion the
 * stream is replaced by still chevrons that only say which way the line flows.
 */
export function FlowParticles({ route, rate, color, opacity = 1, size = 0.2, time, chevronSpacing = 5, options }: FlowParticlesProps) {
  const { reducedMotion } = useSceneEnvironment();
  const invalidate = useThree((state) => state.invalidate);
  const mesh = useRef<InstancedMesh>(null);
  const length = useMemo(() => polylineLength(route), [route]);
  const capacity = Math.max(1, particleCount(length, 1, options));
  const held = time !== undefined;
  const still = reducedMotion && !held;
  const flowing = rate > 0;

  const chevrons = useMemo(() => {
    if (!still || !flowing) return [];
    return chevronDistances(length, chevronSpacing).flatMap((distance) => {
      const sample = pointAlong(route, distance);
      return sample ? [sample] : [];
    });
  }, [still, flowing, length, chevronSpacing, route]);

  useEffect(() => {
    invalidate();
  }, [invalidate, time, rate, route, still]);

  useFrame((state) => {
    const instances = mesh.current;
    if (!instances) return;
    const particles = particlePositions(route, held ? time : state.clock.elapsedTime, rate, options);
    const shown = Math.min(particles.length, capacity);
    for (let index = 0; index < shown; index += 1) {
      const [x, y, z] = particles[index].position;
      instances.setMatrixAt(index, SCRATCH.makeTranslation(x, y, z));
    }
    instances.count = shown;
    instances.instanceMatrix.needsUpdate = true;
    if (!held && flowing) state.invalidate();
  });

  if (still) {
    return (
      <group>
        {chevrons.map((chevron, index) => (
          <mesh key={index} position={toTuple(chevron.position)} quaternion={[...quaternionFromY(chevron.direction)]}>
            <coneGeometry args={[size * 1.9, size * 4.2, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, capacity]} frustumCulled={false}>
      <sphereGeometry args={[size, 8, 6]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </instancedMesh>
  );
}

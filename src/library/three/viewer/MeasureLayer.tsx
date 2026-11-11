import { Html, Line } from '@react-three/drei';

import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

import { formatLength, measurementOf } from './measure';

export type MeasureLayerProps = {
  points: readonly Vec3[];
};

/**
 * The picked points of the measure tool and the line between them, drawn over the model so they
 * stay visible through it, with the distance on a label at the midpoint. Render inside `SceneCanvas`.
 */
export function MeasureLayer({ points }: MeasureLayerProps) {
  const { palette } = useSceneEnvironment();
  const measurement = measurementOf({ points });
  const [first, second] = points;

  return (
    <group>
      {points.map((point, index) => (
        <mesh key={index} position={toTuple(point)} renderOrder={10}>
          <sphereGeometry args={[0.16, 14, 10]} />
          <meshBasicMaterial color={palette.accent.color} depthTest={false} />
        </mesh>
      ))}
      {first && second ? <Line points={[toTuple(first), toTuple(second)]} color={palette.accent.color} lineWidth={2} depthTest={false} renderOrder={10} /> : null}
      {measurement ? (
        <Html position={toTuple(measurement.midpoint)} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div data-slot="measure-label" aria-hidden="true" className="whitespace-nowrap rounded-md border border-[var(--primary-background)] bg-card-background px-2 py-1 font-sans text-xs font-medium tabular-nums text-base-foreground">
            {formatLength(measurement.distance)}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

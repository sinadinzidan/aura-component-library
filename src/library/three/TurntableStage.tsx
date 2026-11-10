import type { ReactNode } from 'react';

import { CameraRig } from './CameraRig';
import { boundsFromFootprint, frameBounds } from './cameraTargets';
import type { CameraView, Vec3 } from './cameraTargets';
import { useSceneEnvironment } from './sceneEnvironment';
import { SceneLights } from './SceneLights';

export type TurntableStageProps = {
  /** Bounding size (x, y, z) of what stands on the stage; the camera frames it. See `EQUIPMENT_SIZES`. */
  subjectSize: Vec3;
  view?: CameraView;
  /** Multiplier on the camera distance. */
  padding?: number;
  /** The model, standing at the origin. */
  children: ReactNode;
};

/**
 * A small stage for showing one model on its own: lights, a round floor with a rim, and orbit
 * controls framed on the subject. The user turns it by dragging. Render it inside `SceneCanvas`.
 */
export function TurntableStage({ subjectSize, view = 'perspective', padding = 1.25, children }: TurntableStageProps) {
  const { palette } = useSceneEnvironment();
  const radius = Math.hypot(subjectSize[0], subjectSize[2]) / 2 + 2;
  const target = frameBounds(boundsFromFootprint([0, 0, 0], subjectSize), { view, padding, aspect: 1.3 });

  return (
    <>
      <SceneLights />
      <CameraRig target={target} minDistance={4} maxDistance={radius * 8} enablePan={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color={palette.ground.color} roughness={1} />
      </mesh>
      {[0.55, 1].map((fraction) => (
        <mesh key={fraction} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[radius * fraction - 0.05, radius * fraction, 64]} />
          <meshBasicMaterial color={fraction === 1 ? palette.frame.color : palette.line.color} />
        </mesh>
      ))}
      {children}
    </>
  );
}

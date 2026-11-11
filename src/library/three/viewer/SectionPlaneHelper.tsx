import { toTuple } from '../cameraTargets';
import type { Bounds } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

import { clipHelperPose } from './clipPlane';
import type { ClipState } from './clipPlane';

export type SectionPlaneHelperProps = {
  bounds: Bounds;
  state: ClipState;
};

/** A faint sheet in the accent colour where the section plane cuts, so the cut is visible. Nothing when the plane is off. */
export function SectionPlaneHelper({ bounds, state }: SectionPlaneHelperProps) {
  const { palette } = useSceneEnvironment();
  if (!state.enabled) return null;
  const pose = clipHelperPose(bounds, state);

  return (
    <mesh position={toTuple(pose.position)} rotation={toTuple(pose.rotation)} renderOrder={5}>
      <planeGeometry args={pose.size} />
      <meshBasicMaterial color={palette.accent.color} transparent opacity={0.14} side={2} depthWrite={false} />
    </mesh>
  );
}

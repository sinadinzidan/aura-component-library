import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';

import type { CameraTarget } from '../cameraTargets';

export type RailCameraProps = {
  /** Where the camera stands and what it looks at. Change it and the camera is there on the next frame. */
  pose: CameraTarget;
};

/**
 * A camera that rides a rail: it does exactly what `pose` says, with no orbit controls and no
 * easing. The pose itself is the animation, so scrubbing and playback stay in step with the
 * distance that drives them.
 */
export function RailCamera({ pose }: RailCameraProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const [px, py, pz] = pose.position;
  const [lx, ly, lz] = pose.lookAt;

  useLayoutEffect(() => {
    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);
    camera.updateMatrixWorld();
    invalidate();
  }, [camera, invalidate, px, py, pz, lx, ly, lz]);

  return null;
}

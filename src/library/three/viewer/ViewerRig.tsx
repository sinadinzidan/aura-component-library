import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MOUSE } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { interpolateTarget } from '../cameraTargets';
import type { CameraTarget } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

import type { ViewerMode } from './ViewerToolbar3d';

export type ViewerRigProps = {
  /** Where the camera should be. Change it and the camera flies there; the first one is applied at once. */
  target: CameraTarget;
  /** What a drag with the main button does. */
  mode?: ViewerMode;
  duration?: number;
  minDistance?: number;
  maxDistance?: number;
  /** Called with the camera's pose when the user lets go of the scene and when a flight arrives. Store it as the target to keep the rig in step. */
  onPose?: (pose: CameraTarget) => void;
  /** Called with the pose while the camera moves, at most every 100 ms, for gizmos and maps that follow it. Do not store it as the target. */
  onLivePose?: (pose: CameraTarget) => void;
  /** Slowly turns the model round. Ignored under reduced motion. Needs a scene that renders every frame. */
  autoRotate?: boolean;
};

type Flight = { from: CameraTarget; to: CameraTarget; startedAt: number | null };

const BUTTONS: Record<ViewerMode, { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE }> = {
  orbit: { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN },
  pan: { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE },
  zoom: { LEFT: MOUSE.DOLLY, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE },
};

/**
 * Orbit controls for a viewer: like `CameraRig`, with a drag mode (orbit, pan or zoom) and a report
 * of the camera pose after every interaction. Flights are instant under reduced motion and stop
 * when the user grabs the scene.
 */
export function ViewerRig({ target, mode = 'orbit', duration = 0.9, minDistance = 4, maxDistance = 120, onPose, onLivePose, autoRotate = false }: ViewerRigProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const flight = useRef<Flight | null>(null);
  const mounted = useRef(false);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const { reducedMotion } = useSceneEnvironment();
  const targetRef = useRef(target);
  const onPoseRef = useRef(onPose);
  const onLiveRef = useRef(onLivePose);
  const lastLive = useRef(0);
  useEffect(() => {
    targetRef.current = target;
    onPoseRef.current = onPose;
    onLiveRef.current = onLivePose;
  });
  const targetKey = [...target.position, ...target.lookAt].join(',');
  const buttons = useMemo(() => BUTTONS[mode], [mode]);

  const currentPose = (): CameraTarget | null => {
    const orbit = controls.current;
    if (!orbit) return null;
    return { position: [camera.position.x, camera.position.y, camera.position.z], lookAt: [orbit.target.x, orbit.target.y, orbit.target.z] };
  };

  const report = () => {
    const pose = currentPose();
    if (!pose) return;
    onLiveRef.current?.(pose);
    onPoseRef.current?.(pose);
  };

  const reportLive = () => {
    const now = performance.now();
    if (now - lastLive.current < 100) return;
    lastLive.current = now;
    const pose = currentPose();
    if (pose) onLiveRef.current?.(pose);
  };

  const apply = (pose: CameraTarget) => {
    camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    const orbit = controls.current;
    if (orbit) {
      orbit.target.set(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
      orbit.update();
    } else {
      camera.lookAt(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
    }
  };

  useEffect(() => {
    const next = targetRef.current;
    const orbit = controls.current;
    if (!mounted.current || reducedMotion || duration <= 0 || !orbit) {
      mounted.current = true;
      flight.current = null;
      apply(next);
      invalidate();
      return;
    }
    flight.current = {
      from: { position: [camera.position.x, camera.position.y, camera.position.z], lookAt: [orbit.target.x, orbit.target.y, orbit.target.z] },
      to: next,
      startedAt: null,
    };
    invalidate();
    // `apply` only touches refs and the camera; the key carries the target's values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, reducedMotion, duration, camera, invalidate]);

  useFrame((state) => {
    const current = flight.current;
    if (!current) return;
    const now = state.clock.elapsedTime;
    current.startedAt ??= now;
    const progress = (now - current.startedAt) / duration;
    apply(interpolateTarget(current.from, current.to, progress));
    if (progress >= 1) {
      flight.current = null;
      report();
    }
    invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      mouseButtons={buttons}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2 - 0.04}
      autoRotate={autoRotate && !reducedMotion}
      autoRotateSpeed={0.8}
      onStart={() => {
        flight.current = null;
      }}
      onChange={onLivePose ? reportLive : undefined}
      onEnd={report}
    />
  );
}

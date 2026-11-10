import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { interpolateTarget } from './cameraTargets';
import type { CameraTarget } from './cameraTargets';
import { useSceneEnvironment } from './sceneEnvironment';

export type CameraRigProps = {
  /** Where the camera should be. Change it and the camera flies there; the first one is applied at once. */
  target: CameraTarget;
  /** Flight time in seconds. Flights are instant under reduced motion. */
  duration?: number;
  /** Closest and furthest the user can zoom. */
  minDistance?: number;
  maxDistance?: number;
  /** Lowest the camera can tilt, in radians from straight down. Defaults to just above the ground. */
  maxPolarAngle?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  /** Called when a flight reaches its target. */
  onArrive?: () => void;
};

/** `startedAt` is set on the flight's first frame, so a slow first render does not eat the animation. */
type Flight = { from: CameraTarget; to: CameraTarget; startedAt: number | null };

/**
 * Orbit controls plus a smooth fly-to. Drive it with a `target` (see `frameBounds` and
 * `cameraTargetFor`); between flights the user can orbit, pan and zoom freely, and grabbing the
 * scene during a flight cancels it. The camera never goes below the ground.
 */
export function CameraRig({
  target,
  duration = 1.1,
  minDistance = 6,
  maxDistance = 400,
  maxPolarAngle = Math.PI / 2 - 0.06,
  enablePan = true,
  enableZoom = true,
  onArrive,
}: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const flight = useRef<Flight | null>(null);
  const mounted = useRef(false);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const { reducedMotion } = useSceneEnvironment();
  const targetRef = useRef(target);
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    targetRef.current = target;
    onArriveRef.current = onArrive;
  });
  const targetKey = [...target.position, ...target.lookAt].join(',');

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
      onArriveRef.current?.();
    }
    invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      enablePan={enablePan}
      enableZoom={enableZoom}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={maxPolarAngle}
      onStart={() => {
        flight.current = null;
      }}
    />
  );
}

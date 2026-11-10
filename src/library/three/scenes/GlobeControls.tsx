import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { easeInOutCubic } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';

import { globeCameraPosition, interpolateOrbit, rotateAboutY } from './geo';
import type { GlobeView } from './geo';

export type GlobeControlsProps = {
  /** The place the camera looks straight down on, and its distance from the centre. Change it and the camera swings there. */
  view: GlobeView;
  /** Turn slowly around the axis while idle. Never under reduced motion. */
  spinning?: boolean;
  /** Seconds per full turn while spinning. */
  spinPeriod?: number;
  /** Swing time in seconds. Instant under reduced motion. */
  duration?: number;
  minDistance?: number;
  maxDistance?: number;
  /** Called when the user grabs the globe. Stop spinning in response. */
  onInteract?: () => void;
};

type Flight = { from: Vec3; to: Vec3; startedAt: number | null };

/**
 * Camera control for a globe: drag to rotate, scroll to zoom, an optional slow idle spin, and a
 * fly-to that swings around the globe along a great circle instead of cutting through it. The
 * camera always looks at the centre. Grabbing the globe cancels a flight and reports `onInteract`.
 */
export function GlobeControls({ view, spinning = false, spinPeriod = 180, duration = 1.4, minDistance = 12, maxDistance = 60, onInteract }: GlobeControlsProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const flight = useRef<Flight | null>(null);
  const lastSpin = useRef<number | null>(null);
  const mounted = useRef(false);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const { reducedMotion } = useSceneEnvironment();
  const onInteractRef = useRef(onInteract);
  useEffect(() => {
    onInteractRef.current = onInteract;
  });
  const { lat, lon, distance } = view;
  const spin = spinning && !reducedMotion && spinPeriod > 0;

  const place = (position: Vec3) => {
    camera.position.set(position[0], position[1], position[2]);
    const orbit = controls.current;
    if (orbit) {
      orbit.target.set(0, 0, 0);
      orbit.update();
    } else {
      camera.lookAt(0, 0, 0);
    }
  };

  useEffect(() => {
    const goal = globeCameraPosition({ lat, lon, distance });
    if (!mounted.current || reducedMotion || duration <= 0) {
      mounted.current = true;
      flight.current = null;
      place(goal);
    } else {
      flight.current = { from: [camera.position.x, camera.position.y, camera.position.z], to: goal, startedAt: null };
    }
    invalidate();
    // `place` only touches refs and the camera; the view's values carry the change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, distance, reducedMotion, duration, camera, invalidate]);

  useEffect(() => {
    lastSpin.current = null;
    if (spin) invalidate();
  }, [spin, invalidate]);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const current = flight.current;
    if (current) {
      current.startedAt ??= now;
      const progress = (now - current.startedAt) / duration;
      place(interpolateOrbit(current.from, current.to, easeInOutCubic(progress)));
      if (progress >= 1) flight.current = null;
      lastSpin.current = null;
      state.invalidate();
      return;
    }
    if (!spin) return;
    // Timed by the clock, not by frames, and capped so a stalled tab does not jump.
    const elapsed = lastSpin.current === null ? 0 : Math.min(now - lastSpin.current, 0.25);
    lastSpin.current = now;
    place(rotateAboutY([camera.position.x, camera.position.y, camera.position.z], (-elapsed / spinPeriod) * Math.PI * 2));
    state.invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      enablePan={false}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
      minDistance={minDistance}
      maxDistance={maxDistance}
      onStart={() => {
        flight.current = null;
        onInteractRef.current?.();
      }}
    />
  );
}

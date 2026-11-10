import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import { CameraRig } from '../CameraRig';
import { frameBounds } from '../cameraTargets';
import type { Vec3, ViewInsetsValue } from '../cameraTargets';
import { useSceneEnvironment } from '../sceneEnvironment';
import { SceneLights } from '../SceneLights';
import { ViewInsets } from '../ViewInsets';

import { FaultCallout } from './FaultCallout';
import { ProjectorBase } from './ProjectorBase';
import { ScanPlane } from './ScanPlane';
import { partSlice, quantizeFraction, scanHeight, scanRange, sectionRadiusAt, slicesAt, sweepFraction } from './scanSweep';
import type { WireframePart } from './scanSweep';
import { WireframeModel } from './WireframeModel';

export type HologramSceneProps = {
  /** The model, standing on its axis (y) above the projector. */
  parts: readonly WireframePart[];
  /** Resolved colour per part id, e.g. from a value ramp. */
  colors?: Readonly<Record<string, string>>;
  faultId?: string | null;
  /** Callout on the faulted part. */
  fault?: { title: string; detail?: string; onClick?: () => void };
  /** Scan position, 0 (bottom) to 1 (top). In auto mode it is the starting point and follows `onScanChange`. */
  scan: number;
  /** Sweep the plane up and down by itself. Ignored under reduced motion. */
  autoScan?: boolean;
  /** Seconds for one sweep up and down. */
  scanPeriod?: number;
  /** Reports the sweep position in steps of 1 %, to drive a readout outside the canvas. */
  onScanChange?: (fraction: number) => void;
  /** Slow turn around the axis. Ignored under reduced motion; set false to pause. */
  rotate?: boolean;
  /** Pixels that overlays cover on each edge of the canvas. */
  insets?: ViewInsetsValue;
  /** Multiplier on the camera distance. */
  padding?: number;
};

const ROTATION_SPEED = 0.22;

/**
 * A holographic scan of one machine: a wireframe model floating above a projector ring, turning
 * slowly, with a scan plane sweeping along it and a ring where the plane cuts the part it is
 * passing. The faulted part glows and carries a callout. Everything holds still under reduced
 * motion, where `scan` alone positions the plane.
 */
export function HologramScene({
  parts,
  colors,
  faultId = null,
  fault,
  scan,
  autoScan = false,
  scanPeriod = 14,
  onScanChange,
  rotate = false,
  insets,
  padding = 1.05,
}: HologramSceneProps) {
  const { reducedMotion } = useSceneEnvironment();
  const model = useRef<Group>(null);
  const plane = useRef<Group>(null);
  const reported = useRef(scan);
  const slices = useMemo(() => parts.map(partSlice), [parts]);
  const range = useMemo(() => scanRange(slices), [slices]);
  const radius = Math.max(1, ...slices.map((slice) => slice.radius));
  const height = scanHeight(range, scan);
  const passing = slicesAt(slices, height).map((slice) => slice.id);
  const faultPart = parts.find((part) => part.id === faultId);
  const sweeping = autoScan && !reducedMotion;
  const turning = rotate && !reducedMotion;
  const target = frameBounds({ min: [-radius * 1.5, 0, -radius * 1.5], max: [radius * 1.5, range.max + 0.6, radius * 1.5] }, { padding, aspect: 1.2 });

  useFrame((state, delta) => {
    if (turning && model.current) model.current.rotation.y += Math.min(delta, 0.1) * ROTATION_SPEED;
    if (sweeping && plane.current) {
      const fraction = sweepFraction(state.clock.elapsedTime, scanPeriod);
      plane.current.position.y = scanHeight(range, fraction);
      const step = quantizeFraction(fraction);
      if (step !== reported.current) {
        reported.current = step;
        onScanChange?.(step);
      }
    }
    if (turning || sweeping) state.invalidate();
  });

  const faultAnchor: Vec3 | null = faultPart ? [faultPart.center[0], faultPart.center[1], faultPart.center[2]] : null;

  return (
    <>
      <SceneLights intensity={0.8} />
      <CameraRig target={target} minDistance={5} maxDistance={radius * 30} enablePan={false} />
      {insets ? <ViewInsets {...insets} /> : null}
      <ProjectorBase radius={radius * 1.7} beamHeight={Math.max(0, range.min - 0.3)} />
      <group ref={model}>
        <WireframeModel parts={parts} colors={colors} activeIds={passing} faultId={faultId} />
      </group>
      <group ref={plane} position={[0, height, 0]}>
        <ScanPlane radius={radius * 1.45} sectionRadius={sectionRadiusAt(slices, height)} />
      </group>
      {faultAnchor && fault ? <FaultCallout position={faultAnchor} title={fault.title} detail={fault.detail} onClick={fault.onClick} /> : null}
    </>
  );
}

import { useMemo } from 'react';

import type { Bounds, CameraTarget, Vec3 } from '../cameraTargets';
import { Ground } from '../Ground';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';

import { clipPlaneFor } from './clipPlane';
import type { ClipState } from './clipPlane';
import { toThreePlane } from './clipRenderer';
import type { ColorKey, ColorMode } from './colorBy';
import { MeasureLayer } from './MeasureLayer';
import type { PartDisplay } from './modelTree';
import { PinLayer } from './PinLayer';
import type { PinState } from './pins';
import { SectionPlaneHelper } from './SectionPlaneHelper';
import { ViewerModel } from './ViewerModel';
import { VIEWER_BOUNDS, findPart } from './viewerModel';
import { ViewerRig } from './ViewerRig';
import type { ViewerMode } from './ViewerToolbar3d';

export type ViewerSceneProps = {
  colors: Readonly<Record<ColorKey, string>>;
  /** Where the camera should be. */
  target: CameraTarget;
  mode?: ViewerMode;
  display?: Readonly<Record<string, PartDisplay>>;
  colorMode?: ColorMode;
  selectedId?: string | null;
  hoveredId?: string | null;
  explode?: number;
  xray?: boolean;
  clip?: ClipState;
  measurePoints?: readonly Vec3[];
  pins?: PinState;
  bounds?: Bounds;
  onPose?: (pose: CameraTarget) => void;
  onLivePose?: (pose: CameraTarget) => void;
  autoRotate?: boolean;
  onPartClick?: (id: string, point: Vec3) => void;
  onPartHover?: (id: string | null) => void;
  onPinSelect?: (id: string) => void;
  /** Shows a label over the selected part. */
  labelSelection?: boolean;
};

/**
 * Everything a viewer canvas holds, assembled: lights, floor, the module, the camera rig, the
 * section plane, measurement and pins. Each feature is optional, so a small specimen mounts only
 * what it demonstrates. Render inside `ViewerStage`.
 */
export function ViewerScene({
  colors,
  target,
  mode = 'orbit',
  display,
  colorMode = 'none',
  selectedId = null,
  hoveredId = null,
  explode = 0,
  xray = false,
  clip,
  measurePoints = [],
  pins,
  bounds = VIEWER_BOUNDS,
  onPose,
  onLivePose,
  autoRotate = false,
  onPartClick,
  onPartHover,
  onPinSelect,
  labelSelection = false,
}: ViewerSceneProps) {
  const plane = useMemo(() => (clip?.enabled ? toThreePlane(clipPlaneFor(bounds, clip)) : null), [clip, bounds]);
  const selected = selectedId ? findPart(selectedId) : undefined;

  return (
    <>
      <SceneLights />
      <ViewerRig target={target} mode={mode} onPose={onPose} onLivePose={onLivePose} autoRotate={autoRotate} />
      <Ground size={[80, 56]} cell={2} majorEvery={5} center={[0, 0]} />
      <ViewerModel
        display={display}
        colors={colors}
        colorMode={colorMode}
        selectedId={selectedId}
        hoveredId={hoveredId}
        explode={explode}
        xray={xray}
        clipPlane={plane}
        onPartClick={onPartClick}
        onPartHover={onPartHover}
      />
      {clip ? <SectionPlaneHelper bounds={bounds} state={clip} /> : null}
      {measurePoints.length > 0 ? <MeasureLayer points={measurePoints} /> : null}
      {pins && pins.items.length > 0 ? <PinLayer state={pins} onSelect={onPinSelect} /> : null}
      {labelSelection && selected ? <SceneLabel position={[selected.position[0], selected.position[1] + selected.size[1] + 0.6, selected.position[2]]} tag={selected.tag} name={selected.name} selected /> : null}
    </>
  );
}

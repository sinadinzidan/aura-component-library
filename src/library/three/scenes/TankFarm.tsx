import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import type { DotShape } from '../../industrial/status';
import { CameraRig } from '../CameraRig';
import { freeViewport, scaleTargetDistance } from '../cameraTargets';
import type { CameraView, Vec3, ViewInsetsValue } from '../cameraTargets';
import { Ground } from '../Ground';
import { PipeRun } from '../PipeRun';
import { useSceneEnvironment } from '../sceneEnvironment';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import type { SceneTone } from '../scenePalette';
import { Selectable } from '../Selectable';
import { StorageTank } from '../StorageTank';
import type { TokenColor } from '../tokenColors';
import { ViewInsets } from '../ViewInsets';

import { BundWall } from './BundWall';
import { IndicatorRing } from './IndicatorRing';
import { SeaPlane } from './SeaPlane';
import { branchRoute, farmCameraTarget, headerRoute, plotBounds, tankLabelAnchor } from './tankFarmLayout';
import type { GroundRect, Manifold, TankSpot } from './tankFarmLayout';

/** One tank in the scene: where it stands, how full it is, and what its ring and label say. */
export type FarmTank = TankSpot & {
  tag: string;
  /** Fill, 0–1. */
  fill: number;
  /** The encoded value in words, on the label: "92 % · high", "Crude oil", "3.6 d". */
  value?: string;
  /** Status of the encoded value. Colours the ring and the label; leave unset for normal. */
  tone?: SceneTone;
  shape?: DotShape;
  /** A category colour for the ring, resolved from a token. Wins over `tone` for the ring only. */
  ringColor?: TokenColor;
};

/** A pipe route that is moving product right now, in flow direction. See `movementRoute`. */
export type FarmFlow = { id: string; points: readonly Vec3[]; tone?: SceneTone };

export type TankFarmProps = {
  tanks: readonly FarmTank[];
  /** Bund walls. See `bundRect`. */
  bunds?: readonly GroundRect[];
  manifold: Manifold;
  /** Routes with flow chevrons, drawn over the manifold. */
  flows?: readonly FarmFlow[];
  /** The paved plot. */
  plot: GroundRect;
  /** Open water beside the plot. */
  sea?: GroundRect;
  selectedId?: string | null;
  /** Called with a tank id. */
  onSelect?: (id: string) => void;
  /** `top` is the plan view; anything else is the 3D view from the south. */
  view?: CameraView;
  showLabels?: boolean;
  /** Distance every other label is pushed away, so neighbours in a row do not collide. */
  labelStagger?: number;
  /** Pixels that overlays cover on each edge of the canvas. */
  insets?: ViewInsetsValue;
  /** Scenery in plot coordinates: jetty, ship, pump house, flare. */
  children?: ReactNode;
};

/**
 * A tank farm: tanks in bunds filled to their level, an indicator ring around each one, the pipe
 * manifold that ties them to the jetty and the pipeline, and flow chevrons on whichever routes are
 * transferring. Selecting a tank dims the others. Everything shown is a prop, so a time scrubber
 * can drive levels and flows from `levelsAt`. Render it inside `SceneCanvas`.
 */
export function TankFarm({ tanks, bunds = [], manifold, flows = [], plot, sea, selectedId = null, onSelect, view = 'perspective', showLabels = true, labelStagger = 11, insets, children }: TankFarmProps) {
  const { palette } = useSceneEnvironment();
  const size = useThree((state) => state.size);
  const fov = useThree((state) => ('fov' in state.camera && typeof state.camera.fov === 'number' ? state.camera.fov : 40));
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};
  const free = freeViewport(size, { top, right, bottom, left });
  const aspect = Math.round((free.width / free.height) * 10) / 10;
  const zoomOut = Math.round((size.height / free.height) * 20) / 20;
  const bounds = useMemo(() => plotBounds(plot, sea, 10), [plot, sea]);
  const target = useMemo(() => scaleTargetDistance(farmCameraTarget(bounds, { plan: view === 'top', aspect, fov }), zoomOut), [bounds, view, aspect, fov, zoomOut]);
  const span = Math.hypot(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2]);
  const header = useMemo(() => headerRoute(tanks, manifold), [tanks, manifold]);
  const branches = useMemo(() => tanks.map((tank) => ({ id: tank.id, points: branchRoute(tank, manifold) })), [tanks, manifold]);
  const hasSelection = selectedId !== null;
  // Every other label is pushed away from its neighbours: upwards in 3D, northwards seen from above.
  const labelPosition = (tank: FarmTank, index: number): Vec3 => {
    const push = (index % 2) * labelStagger;
    if (view !== 'top') return tankLabelAnchor(tank, 1.2 + push);
    const [x, y, z] = tankLabelAnchor(tank, 1.2);
    return [x, y, z - push * 0.6];
  };

  return (
    <>
      <SceneLights sunPosition={[span * 0.35, span * 0.6, span * 0.45]} />
      <CameraRig target={target} minDistance={12} maxDistance={span * 2} />
      <ViewInsets top={top} right={right} bottom={bottom} left={left} />
      <Ground size={[plot.size[0], plot.size[1]]} center={[plot.center[0], plot.center[1]]} />
      {sea ? <SeaPlane size={sea.size} center={sea.center} level={-0.6} cell={6} /> : null}

      {bunds.map((rect, index) => (
        <BundWall key={index} rect={rect} dimmed={hasSelection} />
      ))}

      {tanks.map((tank, index) => {
        const isSelected = tank.id === selectedId;
        const isDimmed = hasSelection && !isSelected;
        const ring = tank.ringColor ?? palette[tank.tone ?? 'neutral'];
        const position: Vec3 = [tank.center[0], 0, tank.center[1]];
        return (
          <group key={tank.id}>
            <Selectable id={tank.id} onSelect={onSelect} selected={isSelected}>
              {(state) => <StorageTank position={position} diameter={tank.diameter} height={tank.height} fill={tank.fill} hovered={state.hovered} selected={state.selected} dimmed={isDimmed} />}
            </Selectable>
            <IndicatorRing position={position} radius={tank.diameter / 2 + 2.2} width={1.1} color={ring.color} opacity={0.95 * ring.opacity} dimmed={isDimmed} />
            {showLabels ? (
              <SceneLabel
                position={labelPosition(tank, index)}
                tag={tank.tag}
                value={tank.value}
                tone={tank.tone}
                shape={tank.shape}
                selected={isSelected}
                dimmed={isDimmed}
                onClick={onSelect ? () => onSelect(tank.id) : undefined}
              />
            ) : null}
          </group>
        );
      })}

      <PipeRun points={header} radius={0.32} dimmed={hasSelection} />
      <PipeRun points={manifold.jetty} radius={0.32} dimmed={hasSelection} />
      <PipeRun points={manifold.pipeline} radius={0.32} dimmed={hasSelection} />
      {branches.map((branch) => (
        <PipeRun key={branch.id} points={branch.points} radius={0.24} dimmed={hasSelection && branch.id !== selectedId} />
      ))}
      {flows.map((flow) => (
        <PipeRun key={flow.id} points={flow.points} radius={0.4} flow flowTone={flow.tone} spacing={6} speed={3} />
      ))}

      {children}
    </>
  );
}

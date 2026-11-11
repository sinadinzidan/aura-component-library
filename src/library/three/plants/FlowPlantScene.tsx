import type { ReactNode } from 'react';

import { CameraRig } from '../CameraRig';
import type { CameraTarget, Vec3, ViewInsetsValue } from '../cameraTargets';
import { EquipmentModel } from '../EquipmentModel';
import { Ground } from '../Ground';
import { pointAlong, polylineLength } from '../pipeGeometry';
import { labelAnchor } from '../plantLayout';
import type { PlantEquipment } from '../plantLayout';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import { ViewInsets } from '../ViewInsets';

import { FlowLine } from './FlowLine';
import type { FlowLineEmphasis } from './FlowLine';
import { FlowValveMarker } from './FlowValveMarker';

/** One process line to draw: its route, the fluid colour, and how much flows. */
export type FlowSceneLine = {
  id: string;
  route: readonly Vec3[];
  /** A resolved token colour for the fluid. */
  color: string;
  /** Flow as a 0–1 share of the reference flow. 0 draws a dark, empty tube. */
  rate: number;
  emphasis?: FlowLineEmphasis;
};

/** A valve on a line, placed a fraction of the way along it. */
export type FlowSceneValve = {
  id: string;
  /** Tag shown on the label. */
  tag: string;
  lineId: string;
  /** 0–1 along the line's route. */
  at: number;
  open: boolean;
};

export type FlowPlantSceneProps = {
  /** Equipment, drawn ghosted so the lines stand out. */
  equipment: readonly PlantEquipment[];
  /** Ids of equipment that carry a tag label. */
  labelled?: readonly string[];
  lines: readonly FlowSceneLine[];
  valves?: readonly FlowSceneValve[];
  /** Plot width (x) and depth (z). */
  size: readonly [number, number];
  target: CameraTarget;
  insets?: ViewInsetsValue;
  /** Called with a line id when a line is clicked. Lines are not clickable without it. */
  onSelectLine?: (lineId: string) => void;
  /** Hold every stream at this time (seconds): for stills. */
  time?: number;
  children?: ReactNode;
};

/** Position and direction of a point a fraction of the way along a route; `null` for a route without length. */
export function pointOnRoute(route: readonly Vec3[], at: number): { position: Vec3; direction: Vec3 } | null {
  return pointAlong(route, polylineLength(route) * Math.min(1, Math.max(0, at)));
}

/**
 * A plant where the lines are the subject: ghosted equipment, translucent tubes with a particle
 * stream whose speed and density follow the flow, and a P&ID-style valve on each switchable line.
 * Lines are picked by clicking anywhere along them. Render it inside `SceneCanvas`.
 */
export function FlowPlantScene({ equipment, labelled = [], lines, valves = [], size, target, insets, onSelectLine, time, children }: FlowPlantSceneProps) {
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};
  const span = Math.hypot(size[0], size[1]);
  const routeOf = (lineId: string): readonly Vec3[] => lines.find((line) => line.id === lineId)?.route ?? [];

  return (
    <>
      <SceneLights sunPosition={[span * 0.35, span * 0.6, span * 0.45]} />
      <CameraRig target={target} minDistance={10} maxDistance={span * 1.6} />
      <ViewInsets top={top} right={right} bottom={bottom} left={left} />
      <Ground size={[size[0], size[1]]} />

      {equipment.map((item) => (
        <group key={item.id}>
          <EquipmentModel equipment={item} dimmed />
          {labelled.includes(item.id) ? <SceneLabel position={labelAnchor(item)} tag={item.tag} dimmed /> : null}
        </group>
      ))}

      {lines.map((line) => (
        <FlowLine key={line.id} id={line.id} route={line.route} color={line.color} rate={line.rate} emphasis={line.emphasis} onSelect={onSelectLine} time={time} />
      ))}

      {valves.map((valve) => {
        const point = pointOnRoute(routeOf(valve.lineId), valve.at);
        if (!point) return null;
        return (
          <group key={valve.id}>
            <FlowValveMarker position={point.position} direction={point.direction} open={valve.open} />
            <SceneLabel
              position={[point.position[0], point.position[1] + 1.2, point.position[2]]}
              tag={valve.tag}
              value={valve.open ? 'Open' : 'Closed'}
              tone={valve.open ? undefined : 'warning'}
              shape={valve.open ? undefined : 'square'}
              maxDistance={span * 1.05}
            />
          </group>
        );
      })}

      {children}
    </>
  );
}

import type { ReactNode } from 'react';

import { CameraRig } from '../CameraRig';
import type { CameraTarget, ViewInsetsValue } from '../cameraTargets';
import { EquipmentModel } from '../EquipmentModel';
import { Ground } from '../Ground';
import { PipeRun } from '../PipeRun';
import { labelAnchor } from '../plantLayout';
import type { PlantLayout } from '../plantLayout';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import { ViewInsets } from '../ViewInsets';

import type { ReplayBeacon, ReplayPipeState } from './replayScene';

export type ReplayPlantSceneProps = {
  /** The plant as data: the same `PlantLayout` a `PlantScene` takes. */
  layout: PlantLayout;
  /** Status per equipment id at the playhead (see `sceneStateAt`). */
  beacons?: Readonly<Record<string, ReplayBeacon>>;
  /** Flow per pipe id at the playhead. Pipes not listed follow their layout. */
  pipes?: Readonly<Record<string, ReplayPipeState>>;
  /** Where the camera is. Change it and the camera cuts there with a short flight. */
  target: CameraTarget;
  /** Seconds a camera cut takes. */
  cutDuration?: number;
  insets?: ViewInsetsValue;
  /** Ids of equipment whose tags are always labelled. Equipment with a status text is labelled too. */
  labelled?: readonly string[];
  /** Flame, value tags and anything else in plant coordinates. */
  children?: ReactNode;
};

/**
 * A plant scene driven by a replay: the layout stays put while status rings, labels and flow
 * chevrons follow the state handed in for the playhead. Stopped lines keep their chevrons, still
 * and in the critical tone, so it is visible where flow was lost. The camera goes wherever
 * `target` says — pass a new viewpoint for a cut, or keep the old one to let the user orbit.
 */
export function ReplayPlantScene({ layout, beacons = {}, pipes = {}, target, cutDuration = 1.3, insets, labelled = [], children }: ReplayPlantSceneProps) {
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};
  const span = Math.hypot(layout.size[0], layout.size[1]);
  const equipment = [...layout.areas.flatMap((area) => area.equipment), ...layout.scenery];

  return (
    <>
      <SceneLights sunPosition={[span * 0.35, span * 0.6, span * 0.45]} />
      <CameraRig target={target} duration={cutDuration} minDistance={8} maxDistance={span * 1.8} />
      <ViewInsets top={top} right={right} bottom={bottom} left={left} />
      <Ground size={[layout.size[0], layout.size[1]]} />

      {equipment.map((item) => {
        const beacon = beacons[item.id];
        const showLabel = labelled.includes(item.id) || Boolean(beacon?.text);
        return (
          <group key={item.id}>
            <EquipmentModel equipment={item} tone={beacon?.tone} pulse={beacon?.pulse} />
            {showLabel ? <SceneLabel position={labelAnchor(item)} tag={item.tag} value={beacon?.text} tone={beacon?.tone} shape={beacon?.shape} /> : null}
          </group>
        );
      })}

      {layout.pipes.map((pipe) => {
        const state: ReplayPipeState = pipes[pipe.id] ?? (pipe.flow ? 'flowing' : 'idle');
        return (
          <PipeRun
            key={pipe.id}
            points={pipe.points}
            radius={pipe.radius}
            flow={state !== 'idle'}
            flowTone={state === 'stopped' ? 'critical' : undefined}
            speed={state === 'stopped' ? 0 : 1.6}
          />
        );
      })}

      {children}
    </>
  );
}

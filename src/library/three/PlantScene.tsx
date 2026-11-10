import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import type { ReactNode } from 'react';

import type { DotShape } from '../industrial/status';

import { AreaVolume } from './AreaVolume';
import { CameraRig } from './CameraRig';
import type { CameraView, Vec3 } from './cameraTargets';
import { EquipmentModel } from './EquipmentModel';
import { Ground } from './Ground';
import { PipeRun } from './PipeRun';
import { anchorPosition, cameraTargetFor, findNode, labelAnchor } from './plantLayout';
import type { PlantLayout } from './plantLayout';
import { SceneLabel } from './SceneLabel';
import { SceneLights } from './SceneLights';
import type { SceneTone } from './scenePalette';
import { Selectable } from './Selectable';
import { SensorMarker } from './SensorMarker';

/** What a scene shows about one area or piece of equipment. Keyed by node id in `statuses`. */
export type PlantNodeStatus = {
  /** Status ring and label dot. Leave unset for normal operation. */
  tone?: SceneTone;
  shape?: DotShape;
  /** Status in words on the label: "Tripped", "2 alarms". */
  text?: string;
  /** Pulse the status ring. */
  pulse?: boolean;
};

export type PlantSceneMarker = {
  equipmentId: string;
  /** Where on the machine: x and z from −1 to 1 across its footprint, y from 0 to 1 up its height. */
  anchor: Vec3;
  tag: string;
  value?: string;
  tone?: SceneTone;
};

export type PlantSceneProps = {
  layout: PlantLayout;
  statuses?: Readonly<Record<string, PlantNodeStatus>>;
  /** Id of the node the camera frames: the plant, an area or a piece of equipment. Defaults to the plant. */
  focusId?: string;
  view?: CameraView;
  /** The area in focus. Its equipment becomes selectable and labelled; everything else dims. */
  activeAreaId?: string | null;
  /** The selected piece of equipment. */
  selectedId?: string | null;
  /** Called with an area id (floor or label clicked) or an equipment id. */
  onSelect?: (id: string) => void;
  showLabels?: boolean;
  /** A sensor position to highlight on a machine. */
  marker?: PlantSceneMarker | null;
  /** Extra three.js content in plant coordinates. */
  children?: ReactNode;
};

/**
 * A whole plant from a `PlantLayout`: ground, lights, camera, areas, equipment, pipes and labels.
 * Selection is controlled — the parent owns `activeAreaId` / `selectedId` (for example with
 * `explorerReducer`) and the scene reports clicks through `onSelect`. Render it inside `SceneCanvas`.
 */
export function PlantScene({
  layout,
  statuses = {},
  focusId,
  view = 'perspective',
  activeAreaId = null,
  selectedId = null,
  onSelect,
  showLabels = true,
  marker = null,
  children,
}: PlantSceneProps) {
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height));
  const fov = useThree((state) => ('fov' in state.camera && typeof state.camera.fov === 'number' ? state.camera.fov : 40));
  const roundedAspect = Math.round(aspect * 10) / 10;
  const target = useMemo(
    () => cameraTargetFor(layout, focusId ?? layout.id, { view, aspect: roundedAspect, fov }),
    [layout, focusId, view, roundedAspect, fov]
  );
  const span = Math.hypot(layout.size[0], layout.size[1]);
  const markerNode = marker ? findNode(layout, marker.equipmentId) : null;
  const markerPosition = marker && markerNode?.type === 'equipment' ? anchorPosition(markerNode.equipment, marker.anchor) : null;

  return (
    <>
      <SceneLights sunPosition={[span * 0.35, span * 0.6, span * 0.45]} />
      <CameraRig target={target} minDistance={8} maxDistance={span * 1.8} />
      <Ground size={[layout.size[0], layout.size[1]]} />

      {layout.areas.map((area) => {
        const isActive = area.id === activeAreaId;
        const isDimmed = activeAreaId !== null && !isActive;
        const status = statuses[area.id];
        const height = area.height ?? 7;
        return (
          <group key={area.id}>
            <AreaVolume id={area.id} center={area.center} size={area.size} height={height} active={isActive} dimmed={isDimmed} onSelect={onSelect} />
            {showLabels && !isActive ? (
              <SceneLabel
                position={[area.center[0], height + 1.5, area.center[1]]}
                tag={area.tag}
                name={area.name}
                value={status?.text}
                tone={status?.tone}
                shape={status?.shape}
                dimmed={isDimmed}
                onClick={onSelect ? () => onSelect(area.id) : undefined}
              />
            ) : null}
            {area.equipment.map((equipment) => {
              const equipmentStatus = statuses[equipment.id];
              const isSelected = equipment.id === selectedId;
              return (
                <group key={equipment.id}>
                  <Selectable id={equipment.id} onSelect={onSelect} selected={isSelected} disabled={!isActive}>
                    {(state) => (
                      <EquipmentModel
                        equipment={equipment}
                        tone={equipmentStatus?.tone}
                        pulse={equipmentStatus?.pulse}
                        hovered={state.hovered}
                        selected={state.selected}
                        dimmed={isDimmed}
                      />
                    )}
                  </Selectable>
                  {showLabels && isActive && !(marker && isSelected) ? (
                    <SceneLabel
                      position={labelAnchor(equipment)}
                      tag={equipment.tag}
                      value={equipmentStatus?.text}
                      tone={equipmentStatus?.tone}
                      shape={equipmentStatus?.shape}
                      selected={isSelected}
                      dimmed={selectedId !== null && !isSelected}
                      onClick={onSelect ? () => onSelect(equipment.id) : undefined}
                    />
                  ) : null}
                </group>
              );
            })}
          </group>
        );
      })}

      {layout.scenery.map((equipment) => (
        <EquipmentModel key={equipment.id} equipment={equipment} dimmed={activeAreaId !== null} />
      ))}

      {layout.pipes.map((pipe) => (
        <PipeRun
          key={pipe.id}
          points={pipe.points}
          radius={pipe.radius}
          flow={pipe.flow}
          dimmed={activeAreaId !== null && pipe.areaId !== undefined && pipe.areaId !== activeAreaId}
        />
      ))}

      {marker && markerPosition ? (
        <>
          <SensorMarker position={markerPosition} tone={marker.tone} />
          <SceneLabel position={[markerPosition[0], markerPosition[1] + 0.9, markerPosition[2]]} tag={marker.tag} value={marker.value} tone={marker.tone} selected />
        </>
      ) : null}

      {children}
    </>
  );
}

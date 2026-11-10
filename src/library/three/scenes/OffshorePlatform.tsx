import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

import { CameraRig } from '../CameraRig';
import { freeViewport, scaleTargetDistance } from '../cameraTargets';
import type { ViewInsetsValue } from '../cameraTargets';
import { EquipmentModel } from '../EquipmentModel';
import { labelAnchor } from '../plantLayout';
import type { PlantNodeStatus } from '../PlantScene';
import { SceneLabel } from '../SceneLabel';
import { SceneLights } from '../SceneLights';
import { Selectable } from '../Selectable';
import { ViewInsets } from '../ViewInsets';

import { DeckModule } from './DeckModule';
import { Derrick } from './Derrick';
import { explodeOffset } from './explode';
import { ExplodeLift } from './ExplodeLift';
import { FlareBoom } from './FlareBoom';
import { Helideck } from './Helideck';
import { LivingQuarters } from './LivingQuarters';
import { PedestalCrane } from './PedestalCrane';
import { PlatformJacket } from './PlatformJacket';
import { platformCameraTarget } from './platformLayout';
import type { PlatformFeature, PlatformLayout } from './platformLayout';
import { SeaPlane } from './SeaPlane';

export type OffshorePlatformProps = {
  layout: PlatformLayout;
  /** 0 (assembled) to 1 (fully exploded). Levels glide to each new value. */
  explode?: number;
  /** The isolated level: the others ghost and the camera flies to it. */
  levelId?: string | null;
  /** The selected piece of equipment on the isolated level. */
  selectedId?: string | null;
  /** Status per level id or equipment id: ring, label dot and label text. */
  statuses?: Readonly<Record<string, PlantNodeStatus>>;
  /** Called with a level id when its label is clicked. */
  onSelectLevel?: (levelId: string) => void;
  /** Called with the level id and equipment id when equipment on the isolated level is clicked. */
  onSelectEquipment?: (levelId: string, equipmentId: string) => void;
  showLabels?: boolean;
  /** Pixels that overlays cover on each edge of the canvas. */
  insets?: ViewInsetsValue;
};

function Feature({ feature, dimmed }: { feature: PlatformFeature; dimmed: boolean }) {
  switch (feature.kind) {
    case 'derrick':
      return <Derrick position={feature.position} dimmed={dimmed} />;
    case 'crane':
      return <PedestalCrane position={feature.position} rotationY={feature.rotationY} dimmed={dimmed} />;
    case 'helideck':
      return <Helideck position={feature.position} dimmed={dimmed} />;
    case 'flare-boom':
      return <FlareBoom position={feature.position} rotationY={feature.rotationY} dimmed={dimmed} />;
    case 'quarters':
      return <LivingQuarters position={feature.position} dimmed={dimmed} />;
  }
}

/**
 * An offshore production platform from a `PlatformLayout`: sea, jacket, stacked decks with their
 * equipment, and the landmarks on top. Two controls drive it. `explode` separates the levels
 * along the vertical axis so every deck can be seen; `levelId` isolates one level, ghosting the
 * rest and flying the camera to it — only then is that level's equipment selectable and labelled.
 * Selection is controlled; pair it with `platformReducer`. Render it inside `SceneCanvas`.
 */
export function OffshorePlatform({
  layout,
  explode = 0,
  levelId = null,
  selectedId = null,
  statuses = {},
  onSelectLevel,
  onSelectEquipment,
  showLabels = true,
  insets,
}: OffshorePlatformProps) {
  const size = useThree((state) => state.size);
  const fov = useThree((state) => ('fov' in state.camera && typeof state.camera.fov === 'number' ? state.camera.fov : 40));
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};
  const free = freeViewport(size, { top, right, bottom, left });
  const aspect = Math.round((free.width / free.height) * 10) / 10;
  const zoomOut = Math.round((size.height / free.height) * 20) / 20;
  const target = useMemo(() => scaleTargetDistance(platformCameraTarget(layout, { explode, levelId, aspect, fov }), zoomOut), [layout, explode, levelId, aspect, fov, zoomOut]);
  const [width, depth] = layout.size;
  const span = Math.hypot(width, depth);

  return (
    <>
      <SceneLights sunPosition={[span * 0.6, span * 1.6, span * 0.9]} />
      <CameraRig target={target} minDistance={14} maxDistance={span * 7} />
      <ViewInsets top={top} right={right} bottom={bottom} left={left} />
      <SeaPlane size={[span * 5, span * 5]} cell={span / 4} />

      {layout.levels.map((level, index) => {
        const isolated = level.id === levelId;
        const ghost = levelId !== null && !isolated;
        const status = statuses[level.id];
        return (
          <ExplodeLift key={level.id} y={explodeOffset(index, explode, layout.gap)}>
            {level.kind === 'jacket' ? (
              <PlatformJacket topSize={[width * 0.8, depth * 0.75]} baseSize={[width * 1.05, depth * 1.1]} topY={level.elevation - 0.6} bottomY={-level.height} dimmed={ghost} />
            ) : (
              <group position={[0, level.elevation, 0]}>
                <DeckModule size={[width, level.height, depth]} handrail={level.height === 0} dimmed={ghost}>
                  {level.equipment.map((equipment) => {
                    const equipmentStatus = statuses[equipment.id];
                    const isSelected = equipment.id === selectedId;
                    return (
                      <group key={equipment.id}>
                        <Selectable id={equipment.id} onSelect={onSelectEquipment ? (id) => onSelectEquipment(level.id, id) : undefined} selected={isSelected} disabled={!isolated}>
                          {(state) => (
                            <EquipmentModel
                              equipment={equipment}
                              tone={equipmentStatus?.tone}
                              pulse={equipmentStatus?.pulse}
                              hovered={state.hovered}
                              selected={state.selected}
                              dimmed={ghost}
                            />
                          )}
                        </Selectable>
                        {showLabels && isolated ? (
                          <SceneLabel
                            position={labelAnchor(equipment)}
                            tag={equipment.tag}
                            value={equipmentStatus?.text}
                            tone={equipmentStatus?.tone}
                            shape={equipmentStatus?.shape}
                            selected={isSelected}
                            dimmed={selectedId !== null && !isSelected}
                            onClick={onSelectEquipment ? () => onSelectEquipment(level.id, equipment.id) : undefined}
                          />
                        ) : null}
                      </group>
                    );
                  })}
                  {(level.features ?? []).map((feature) => (
                    <Feature key={feature.id} feature={feature} dimmed={ghost} />
                  ))}
                </DeckModule>
              </group>
            )}
            {showLabels && levelId === null ? (
              <SceneLabel
                position={[width / 2 + 1.5, level.kind === 'jacket' ? level.elevation * 0.4 : level.elevation + Math.max(level.height, 3) * 0.5 - 2, depth / 2 + 1.5]}
                tag={level.name}
                value={status?.text}
                tone={status?.tone}
                shape={status?.shape}
                onClick={onSelectLevel ? () => onSelectLevel(level.id) : undefined}
              />
            ) : null}
          </ExplodeLift>
        );
      })}
    </>
  );
}
